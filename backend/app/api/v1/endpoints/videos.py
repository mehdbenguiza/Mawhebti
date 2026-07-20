from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.video import Video, VideoStatus
from app.schemas.video import VideoResponse
from app.services.video_service import VideoService
from app.models.parent_child import ParentChildLink, LinkStatus

router = APIRouter()

@router.post("/upload", response_model=VideoResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await VideoService.upload_video(db, current_user, title, description, file, background_tasks)

@router.get("/me", response_model=List[VideoResponse])
def get_my_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return VideoService.get_user_videos(db, str(current_user.id))

@router.get("/pending", response_model=List[VideoResponse])
def get_pending_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Réservé aux parents.")
        
    links = db.query(ParentChildLink).filter(
        ParentChildLink.parent_id == current_user.id,
        ParentChildLink.status == LinkStatus.APPROVED
    ).all()
    
    child_ids = [link.child_id for link in links]
    if not child_ids:
        return []
        
    return db.query(Video).filter(
        Video.user_id.in_(child_ids),
        Video.status == VideoStatus.PENDING_CONSENT
    ).all()

@router.put("/{video_id}/consent", response_model=VideoResponse)
def consent_to_video(
    video_id: str,
    action: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Réservé aux parents.")
        
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Vidéo introuvable")
        
    link = db.query(ParentChildLink).filter(
        ParentChildLink.parent_id == current_user.id,
        ParentChildLink.child_id == video.user_id,
        ParentChildLink.status == LinkStatus.APPROVED
    ).first()
    
    if not link:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à valider cette vidéo.")
        
    if action == "approve":
        if video.transcription: 
            video.status = VideoStatus.PUBLISHED
        else:
            video.status = VideoStatus.PROCESSING 
    elif action == "reject":
        video.status = VideoStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Action invalide (use approve or reject)")
        
    db.commit()
    db.refresh(video)
    return video

from typing import Optional
from app.schemas.video import VideoFeedResponse
from sqlalchemy import desc
from app.models.profile import Profile

@router.get("/feed", response_model=List[VideoFeedResponse])
def get_video_feed(
    page: int = 1,
    limit: int = 10,
    sort_by: str = "recent",
    category: Optional[str] = None,
    db: Session = Depends(get_db)
    # Auth is completely optional for reading the feed!
):
    query = db.query(Video, User, Profile).join(
        User, Video.user_id == User.id
    ).outerjoin(
        Profile, User.id == Profile.user_id
    ).filter(
        Video.status == VideoStatus.PUBLISHED
    )
    
    # Sort
    if sort_by == "popular":
        query = query.order_by(desc(Video.views_count), desc(Video.likes_count), desc(Video.created_at))
    else:
        # Default: recent
        query = query.order_by(desc(Video.created_at))
        
    # Pagination
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()
    
    # Map to schema
    feed = []
    for video, user, profile in results:
        # Pydantic will convert the Video object, we just inject the creator part
        video_dict = video.__dict__.copy()
        
        # Build creator info
        creator_info = {
            "id": user.id,
            "first_name": profile.first_name if profile else None,
            "last_name": profile.last_name if profile else None,
            "trust_level": user.trust_level
        }
        video_dict["creator"] = creator_info
        
        feed.append(video_dict)
        
    return feed
