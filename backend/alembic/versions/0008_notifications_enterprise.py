"""Sprint 8.1 — Notifications Enterprise Architecture

Revision ID: 0008_notifications_enterprise
Revises: 0007_notifications_v2
Create Date: 2026-07-25 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0008_notifications_enterprise'
down_revision = '0007_notifications_v2'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # ── Add new columns to notifications table ──
    op.add_column('notifications', sa.Column('category', sa.String(50), server_default='SOCIAL', nullable=False))
    op.add_column('notifications', sa.Column('entity_type', sa.String(50), nullable=True))
    op.add_column('notifications', sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('notifications', sa.Column('action_type', sa.String(50), server_default='NONE', nullable=False))
    op.add_column('notifications', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('notifications', sa.Column('channels_sent', sa.JSON(), server_default='{}', nullable=True))
    op.add_column('notifications', sa.Column('payload', sa.JSON(), server_default='{}', nullable=True))

    # ── Create Indexes ──
    op.create_index('ix_notifications_entity', 'notifications', ['entity_type', 'entity_id'], unique=False)
    op.create_index('ix_notifications_recipient_status_date', 'notifications', ['recipient_id', 'is_read', 'is_seen', 'created_at'], unique=False)
    op.create_foreign_key('fk_notifications_created_by', 'notifications', 'users', ['created_by'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_notifications_created_by', 'notifications', type_='foreignkey')
    op.drop_index('ix_notifications_recipient_status_date', table_name='notifications')
    op.drop_index('ix_notifications_entity', table_name='notifications')
    
    op.drop_column('notifications', 'payload')
    op.drop_column('notifications', 'channels_sent')
    op.drop_column('notifications', 'created_by')
    op.drop_column('notifications', 'action_type')
    op.drop_column('notifications', 'entity_id')
    op.drop_column('notifications', 'entity_type')
    op.drop_column('notifications', 'category')
