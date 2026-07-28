"""sprint91_campaigns_social

Revision ID: 0010_sprint91_campaigns_social
Revises: 0009_sprint9_crowdfunding
Create Date: 2026-07-27 20:01:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0010_sprint91_campaigns_social'
down_revision = '0009_sprint9_crowdfunding'
branch_labels = None
depends_on = None

def upgrade():
    # add new columns to campaigns
    op.add_column('campaigns', sa.Column('invite_code', sa.CHAR(length=12), nullable=True))
    op.create_unique_constraint('uq_campaigns_invite_code', 'campaigns', ['invite_code'])
    op.add_column('campaigns', sa.Column('views_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('campaigns', sa.Column('shares_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('campaigns', sa.Column('favorites_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('campaigns', sa.Column('comments_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('campaigns', sa.Column('donors_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('campaigns', sa.Column('last_donation_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('campaigns', sa.Column('published_at', sa.DateTime(timezone=True), nullable=True))

    # create tables
    op.create_table('campaign_comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('parent_comment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['campaign_comments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaign_comments_author_id'), 'campaign_comments', ['author_id'], unique=False)
    op.create_index(op.f('ix_campaign_comments_campaign_id'), 'campaign_comments', ['campaign_id'], unique=False)

    op.create_table('campaign_favorites',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('campaign_id', 'user_id', name='uq_campaign_favorites')
    )

    op.create_table('campaign_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reporter_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_campaign_reports_campaign_id'), 'campaign_reports', ['campaign_id'], unique=False)

    # indexes on campaigns
    op.create_index('ix_campaigns_status_visibility', 'campaigns', ['status', 'visibility'])
    op.create_index('ix_campaigns_current_amount', 'campaigns', ['current_amount'])


def downgrade():
    op.drop_index('ix_campaigns_current_amount', table_name='campaigns')
    op.drop_index('ix_campaigns_status_visibility', table_name='campaigns')

    op.drop_index(op.f('ix_campaign_reports_campaign_id'), table_name='campaign_reports')
    op.drop_table('campaign_reports')
    
    op.drop_table('campaign_favorites')
    
    op.drop_index(op.f('ix_campaign_comments_campaign_id'), table_name='campaign_comments')
    op.drop_index(op.f('ix_campaign_comments_author_id'), table_name='campaign_comments')
    op.drop_table('campaign_comments')

    op.drop_column('campaigns', 'published_at')
    op.drop_column('campaigns', 'last_donation_at')
    op.drop_column('campaigns', 'donors_count')
    op.drop_column('campaigns', 'comments_count')
    op.drop_column('campaigns', 'favorites_count')
    op.drop_column('campaigns', 'shares_count')
    op.drop_column('campaigns', 'views_count')
    op.drop_constraint('uq_campaigns_invite_code', 'campaigns', type_='unique')
    op.drop_column('campaigns', 'invite_code')
