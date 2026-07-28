from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class CampaignCardResponse(BaseModel):
    id: UUID
    title: str
    category: str
    location: Optional[str]
    target_amount: Decimal
    current_amount: Decimal
    completion_percentage: float
    currency: str
    status: str
    visibility: str
    donors_count: int
    views_count: int
    end_date: datetime
    cover_image: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class CampaignDetailResponse(CampaignCardResponse):
    description: str
    video_pitch: Optional[str]
    shares_count: int
    favorites_count: int
    comments_count: int
    start_date: datetime
    published_at: Optional[datetime]
    creator_id: UUID

class CampaignStatisticsResponse(BaseModel):
    campaign_id: UUID
    views_count: int
    shares_count: int
    favorites_count: int
    donors_count: int
    comments_count: int
    current_amount: Decimal
    target_amount: Decimal
    completion_percentage: float
    last_donation_at: Optional[datetime]
    average_donation: Optional[Decimal]

class CampaignDonorResponse(BaseModel):
    donor_display_name: str  # 'Anonyme' si anonymous=True
    amount: Decimal
    currency: str
    created_at: datetime
    message: Optional[str]
    class Config:
        from_attributes = True

class CampaignCommentResponse(BaseModel):
    id: UUID
    author_name: str
    content: str
    parent_comment_id: Optional[UUID]
    created_at: datetime
    edited_at: Optional[datetime]
    replies: List['CampaignCommentResponse'] = []
    class Config:
        from_attributes = True

CampaignCommentResponse.model_rebuild()
