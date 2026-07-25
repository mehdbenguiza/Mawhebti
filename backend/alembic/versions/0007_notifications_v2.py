"""Sprint 8 — Notifications V2

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-25 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0007_notifications_v2'
down_revision = '0006_video_interactions'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # ── 1. Update notifications table ──
    op.add_column('notifications', sa.Column('is_seen', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('notifications', sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('notifications', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    
    # ── 2. Create notification_settings table ──
    op.create_table(
        'notification_settings',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('likes_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('messages_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('recruitment_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('crowdfunding_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('emails_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )


def downgrade() -> None:
    op.drop_table('notification_settings')
    op.drop_column('notifications', 'updated_at')
    op.drop_column('notifications', 'is_deleted')
    op.drop_column('notifications', 'is_seen')
