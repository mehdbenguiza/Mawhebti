"""Sprint 6 — video interactions: likes, views, reports

Revision ID: 0006_video_interactions
Revises: 0005_messaging_recruitment
Create Date: 2026-07-22 21:00:00.000000

Crée les 3 tables nécessaires aux interactions vidéo :
  - video_likes   : J'aimes (unique par user+video)
  - video_views   : Vues analytiques (supporte anonymes via session_id)
  - video_reports : Signalements (unique par user+video, anti-spam)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '0006_video_interactions'
down_revision = '0005_messaging_recruitment'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. video_likes ──────────────────────────────────────────────────────
    op.create_table(
        'video_likes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        # Un utilisateur ne peut liker qu'une seule fois la même vidéo
        sa.UniqueConstraint('user_id', 'video_id', name='uix_user_video_like'),
    )
    op.create_index('ix_video_likes_user_id', 'video_likes', ['user_id'])
    op.create_index('ix_video_likes_video_id', 'video_likes', ['video_id'])

    # ── 2. video_views ──────────────────────────────────────────────────────
    op.create_table(
        'video_views',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', postgresql.UUID(as_uuid=True), nullable=False),
        # user_id nullable : les visiteurs anonymes ont uniquement un session_id
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('watched_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_video_views_video_id', 'video_views', ['video_id'])
    op.create_index('ix_video_views_user_id', 'video_views', ['user_id'])
    op.create_index('ix_video_views_session_id', 'video_views', ['session_id'])

    # ── 3. video_reports ────────────────────────────────────────────────────
    op.create_table(
        'video_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('video_id', postgresql.UUID(as_uuid=True), nullable=False),
        # user_id nullable pour les anciens signalements anonymes éventuels
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        # Un utilisateur ne peut signaler qu'une seule fois la même vidéo
        sa.UniqueConstraint('user_id', 'video_id', name='uix_user_video_report'),
    )
    op.create_index('ix_video_reports_video_id', 'video_reports', ['video_id'])
    op.create_index('ix_video_reports_user_id', 'video_reports', ['user_id'])


def downgrade() -> None:
    op.drop_table('video_reports')
    op.drop_table('video_views')
    op.drop_table('video_likes')
