"""Sprint 3: Parent-Child Links and Videos

Revision ID: 0002_sprint3
Revises: 0001_initial
Create Date: 2026-07-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0002_sprint3'
down_revision: Union[str, None] = '0001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # parent_child_links table
    op.create_table(
        'parent_child_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='linkstatus'), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_parent_child_links_parent_id', 'parent_child_links', ['parent_id'])
    op.create_index('ix_parent_child_links_child_id', 'parent_child_links', ['child_id'])

    # videos table
    op.create_table(
        'videos',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(512), nullable=False),
        sa.Column('status', sa.Enum('UPLOADING', 'PROCESSING', 'PENDING_CONSENT', 'PUBLISHED', 'REJECTED', name='videostatus'), nullable=False, server_default='UPLOADING'),
        sa.Column('transcription', sa.Text(), nullable=True),
        sa.Column('ai_tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_videos_user_id', 'videos', ['user_id'])


def downgrade() -> None:
    op.drop_table('videos')
    op.drop_table('parent_child_links')
    op.execute("DROP TYPE IF EXISTS videostatus")
    op.execute("DROP TYPE IF EXISTS linkstatus")
