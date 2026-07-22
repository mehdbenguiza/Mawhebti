import pytest
from uuid import uuid4
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.video import Video, VideoStatus, VideoLike, VideoView

@pytest.fixture
def test_video(db_session: Session, test_user: User):
    video = Video(
        user_id=test_user.id,
        title="My awesome video",
        file_path="/uploads/test.mp4",
        status=VideoStatus.PUBLISHED
    )
    db_session.add(video)
    db_session.commit()
    db_session.refresh(video)
    return video

def test_like_video_connected(client, authorized_client, test_video):
    # Like
    res = authorized_client.post(f"/api/v1/videos/{test_video.id}/like")
    assert res.status_code == 200
    assert res.json()["action"] == "liked"
    assert res.json()["likes_count"] == 1
    
    # Unlike (Toggle)
    res = authorized_client.post(f"/api/v1/videos/{test_video.id}/like")
    assert res.status_code == 200
    assert res.json()["action"] == "unliked"
    assert res.json()["likes_count"] == 0

def test_double_like_prevented(client, authorized_client, test_video):
    # Testing that the API acts as a toggle, so clicking it twice means like then unlike.
    res1 = authorized_client.post(f"/api/v1/videos/{test_video.id}/like")
    res2 = authorized_client.post(f"/api/v1/videos/{test_video.id}/like")
    assert res2.json()["action"] == "unliked"

def test_like_video_unconnected(client, test_video):
    res = client.post(f"/api/v1/videos/{test_video.id}/like")
    assert res.status_code == 401

def test_view_video_3_seconds(client, test_video):
    # View by anonymous
    res = client.post(f"/api/v1/videos/{test_video.id}/view", json={
        "session_id": "session-123",
        "watched_seconds": 3,
        "completed": False
    })
    assert res.status_code == 200
    assert res.json()["status"] == "recorded"
    assert res.json()["views_count"] == 1

def test_view_multiple_refresh(client, test_video):
    payload = {"session_id": "session-123", "watched_seconds": 3, "completed": False}
    
    # First view
    client.post(f"/api/v1/videos/{test_video.id}/view", json=payload)
    
    # Refresh (same session) -> should be "updated", NOT "recorded"
    res = client.post(f"/api/v1/videos/{test_video.id}/view", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "updated"
    assert res.json()["views_count"] == 1  # Count does not increase

def test_view_video_connected(authorized_client, test_video):
    res = authorized_client.post(f"/api/v1/videos/{test_video.id}/view", json={
        "session_id": "ignored",
        "watched_seconds": 5,
        "completed": True
    })
    assert res.status_code == 200
    assert res.json()["status"] == "recorded"
    assert res.json()["views_count"] == 1
    
    # Second view by same connected user
    res2 = authorized_client.post(f"/api/v1/videos/{test_video.id}/view", json={
        "session_id": "ignored",
        "watched_seconds": 10,
        "completed": True
    })
    assert res2.json()["status"] == "updated"
    assert res2.json()["views_count"] == 1
