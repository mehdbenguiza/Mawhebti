import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.messaging import Notification, NotificationType, NotificationSettings

def test_get_notifications_empty(client: TestClient, authorized_client: TestClient):
    response = authorized_client.get("/api/v1/notifications")
    assert response.status_code == 200
    assert response.json()["total"] == 0

def test_create_and_get_notification(client: TestClient, authorized_client: TestClient, db_session: Session, test_user):
    # Manually create a notification
    notif = Notification(
        recipient_id=test_user.id,
        notification_type=NotificationType.SYSTEM,
        title="Welcome",
        body="Welcome to Mawhebti"
    )
    db_session.add(notif)
    db_session.commit()

    response = authorized_client.get("/api/v1/notifications")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Welcome"
    assert data["items"][0]["is_read"] is False

def test_mark_as_read(client: TestClient, authorized_client: TestClient, db_session: Session, test_user):
    notif = Notification(
        recipient_id=test_user.id,
        notification_type=NotificationType.SYSTEM,
        title="Test Read",
        body="Test Body"
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)

    response = authorized_client.put(f"/api/v1/notifications/{notif.id}/read")
    assert response.status_code == 200
    assert response.json()["is_read"] is True

def test_soft_delete_notification(client: TestClient, authorized_client: TestClient, db_session: Session, test_user):
    notif = Notification(
        recipient_id=test_user.id,
        notification_type=NotificationType.SYSTEM,
        title="To Delete",
        body="Delete me"
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)

    response = authorized_client.delete(f"/api/v1/notifications/{notif.id}")
    assert response.status_code == 200

    # Verify it doesn't appear in list
    list_response = authorized_client.get("/api/v1/notifications")
    assert list_response.json()["total"] == 0

def test_get_summary(client: TestClient, authorized_client: TestClient, db_session: Session, test_user):
    notif = Notification(
        recipient_id=test_user.id,
        notification_type=NotificationType.SYSTEM,
        title="Unread Notif",
        body="Body"
    )
    db_session.add(notif)
    db_session.commit()

    response = authorized_client.get("/api/v1/notifications/summary")
    assert response.status_code == 200
    assert response.json()["unread"] == 1
    assert response.json()["total"] == 1

def test_mark_all_as_seen(client: TestClient, authorized_client: TestClient, db_session: Session, test_user):
    notif = Notification(
        recipient_id=test_user.id,
        notification_type=NotificationType.SYSTEM,
        title="Unseen Notif",
        body="Body",
        is_seen=False
    )
    db_session.add(notif)
    db_session.commit()

    response = authorized_client.put("/api/v1/notifications/seen")
    assert response.status_code == 200
    assert "1 notifications marked as seen" in response.json()["message"]

def test_update_settings(client: TestClient, authorized_client: TestClient, db_session: Session, test_user):
    response = authorized_client.put("/api/v1/notifications/settings", json={
        "likes_enabled": False,
        "messages_enabled": True,
        "recruitment_enabled": False,
        "crowdfunding_enabled": True,
        "emails_enabled": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["likes_enabled"] is False
    assert data["messages_enabled"] is True
    assert data["emails_enabled"] is False
