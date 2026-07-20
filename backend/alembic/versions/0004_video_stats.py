"""add video stats

Revision ID: 0004_video_stats
Revises: 0003_trust_levels
Create Date: 2026-07-20 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004_video_stats'
down_revision = '0003_trust_levels'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('videos', sa.Column('views_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('videos', sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'))

def downgrade() -> None:
    op.drop_column('videos', 'likes_count')
    op.drop_column('videos', 'views_count')
