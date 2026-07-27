"""Sprint 9 — Crowdfunding & Finance Enterprise

Revision ID: 0009_sprint9_crowdfunding
Revises: 0008_notifications_enterprise
Create Date: 2026-07-27 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0009_sprint9_crowdfunding'
down_revision = '0008_notifications_enterprise'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── campaigns ──────────────────────────────────────────────────────────
    op.create_table(
        'campaigns',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('creator_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('owner_type', sa.String(50), nullable=False),
        sa.Column('beneficiary_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('target_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('current_amount', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('currency', sa.String(50), nullable=False, server_default='EUR'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('visibility', sa.String(50), server_default='PUBLIC'),
        sa.Column('cover_image', sa.String(512), nullable=True),
        sa.Column('video_pitch', sa.String(512), nullable=True),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='DRAFT'),
        sa.Column('admin_comment', sa.Text, nullable=True),
        sa.Column('verification_level', sa.String(50), nullable=False, server_default='UNVERIFIED'),
        sa.Column('is_featured', sa.Boolean, server_default='false'),
        sa.Column('is_verified', sa.Boolean, server_default='false'),
        sa.Column('version', sa.Integer, nullable=False, server_default='1'),
        sa.Column('is_deleted', sa.Boolean, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('target_amount >= 10 AND target_amount <= 100000', name='check_target_amount_range'),
        sa.CheckConstraint('current_amount >= 0', name='check_current_amount_positive'),
        sa.CheckConstraint('end_date > start_date', name='check_end_date_after_start_date'),
    )
    op.create_index('ix_campaigns_category', 'campaigns', ['category'])
    op.create_index('ix_campaigns_status', 'campaigns', ['status'])
    op.create_index('ix_campaigns_end_date', 'campaigns', ['end_date'])

    # ── campaign_audits ────────────────────────────────────────────────────
    op.create_table(
        'campaign_audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('performed_by', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('old_status', sa.String(100), nullable=True),
        sa.Column('new_status', sa.String(100), nullable=True),
        sa.Column('reason', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── payment_intents ────────────────────────────────────────────────────
    op.create_table(
        'payment_intents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('donor_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('provider_payment_id', sa.String(255), nullable=False, unique=True),
        sa.Column('checkout_url', sa.String(1024), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='CREATED'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_payment_intents_provider_payment_id', 'payment_intents', ['provider_payment_id'])

    # ── donations ──────────────────────────────────────────────────────────
    op.create_table(
        'donations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('donor_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('payment_intents.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('currency', sa.String(10), nullable=False),
        sa.Column('anonymous', sa.Boolean, server_default='false'),
        sa.Column('message', sa.Text, nullable=True),
        sa.Column('payment_method', sa.String(100), nullable=True),
        sa.Column('payment_status', sa.String(50), nullable=False, server_default='PENDING'),
        sa.Column('transaction_reference', sa.String(255), nullable=True, unique=True),
        sa.Column('platform_fee', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('net_amount', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint('amount > 0', name='check_donation_amount_positive'),
    )

    # ── financial_transactions ─────────────────────────────────────────────
    op.create_table(
        'financial_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('donation_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('donations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('fee', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('net_amount', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('transaction_direction', sa.String(50), nullable=False),
        sa.Column('transaction_reason', sa.String(50), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('provider_reference', sa.String(255), nullable=False, unique=True),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_financial_transactions_provider_reference', 'financial_transactions', ['provider_reference'])

    # ── withdrawals ────────────────────────────────────────────────────────
    op.create_table(
        'withdrawals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='REQUESTED'),
        sa.Column('provider_reference', sa.String(255), nullable=True),
        sa.Column('requested_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # ── donation_receipts ──────────────────────────────────────────────────
    op.create_table(
        'donation_receipts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('donation_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('donations.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('receipt_number', sa.String(255), nullable=False, unique=True),
        sa.Column('pdf_url', sa.String(1024), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── fraud_checks ───────────────────────────────────────────────────────
    op.create_table(
        'fraud_checks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('donation_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('donations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('risk_score', sa.Integer, nullable=False, server_default='0'),
        sa.Column('decision', sa.String(50), nullable=False, server_default='CLEAN'),
        sa.Column('reasons', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('fraud_checks')
    op.drop_table('donation_receipts')
    op.drop_table('withdrawals')
    op.drop_index('ix_financial_transactions_provider_reference', table_name='financial_transactions')
    op.drop_table('financial_transactions')
    op.drop_table('donations')
    op.drop_index('ix_payment_intents_provider_payment_id', table_name='payment_intents')
    op.drop_table('payment_intents')
    op.drop_table('campaign_audits')
    op.drop_index('ix_campaigns_end_date', table_name='campaigns')
    op.drop_index('ix_campaigns_status', table_name='campaigns')
    op.drop_index('ix_campaigns_category', table_name='campaigns')
    op.drop_table('campaigns')
