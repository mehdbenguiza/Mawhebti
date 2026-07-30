revision = '0011_payment_core'
down_revision = '0010_sprint91_campaigns_social'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Table wallets
    op.create_table('wallets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('currency', sa.String(10), nullable=False, server_default='TND'),
        sa.Column('available_balance', sa.Numeric(12,2), nullable=False, server_default='0'),
        sa.Column('pending_balance', sa.Numeric(12,2), nullable=False, server_default='0'),
        sa.Column('locked_balance', sa.Numeric(12,2), nullable=False, server_default='0'),
        sa.Column('total_received', sa.Numeric(12,2), nullable=False, server_default='0'),
        sa.Column('total_withdrawn', sa.Numeric(12,2), nullable=False, server_default='0'),
        sa.Column('total_refunded', sa.Numeric(12,2), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Table wallet_transactions (IMMUABLE - jamais d'UPDATE)
    op.create_table('wallet_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('wallet_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('wallets.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('transaction_type', sa.String(50), nullable=False),  # CREDIT, DEBIT, LOCK, UNLOCK
        sa.Column('amount', sa.Numeric(12,2), nullable=False),
        sa.Column('balance_before', sa.Numeric(12,2), nullable=False),
        sa.Column('balance_after', sa.Numeric(12,2), nullable=False),
        sa.Column('reference', sa.String(255), nullable=False, unique=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_wallet_transactions_wallet_id', 'wallet_transactions', ['wallet_id'])
    op.create_index('ix_wallet_transactions_reference', 'wallet_transactions', ['reference'], unique=True)
    
    # Table payment_events (idempotence webhooks)
    op.create_table('payment_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('provider_event_id', sa.String(255), nullable=False, unique=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('payload', postgresql.JSON, nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('status', sa.String(20), nullable=False, server_default='PROCESSED'),
    )
    op.create_index('ix_payment_events_provider_event_id', 'payment_events', ['provider_event_id'], unique=True)
    
    # Colonnes manquantes sur payment_intents
    op.add_column('payment_intents', sa.Column('amount', sa.Numeric(12,2), nullable=True))
    op.add_column('payment_intents', sa.Column('currency', sa.String(10), server_default='TND'))
    
    # Colonnes manquantes sur financial_transactions
    op.add_column('financial_transactions', sa.Column('wallet_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('financial_transactions', sa.Column('gross_amount', sa.Numeric(12,2), nullable=True))
    op.add_column('financial_transactions', sa.Column('platform_fee', sa.Numeric(12,2), server_default='0'))
    op.add_column('financial_transactions', sa.Column('provider_fee', sa.Numeric(12,2), server_default='0'))
    
    # Colonnes sur withdrawals
    op.add_column('withdrawals', sa.Column('wallet_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('withdrawals', sa.Column('currency', sa.String(10), server_default='TND'))
    op.add_column('withdrawals', sa.Column('reason', sa.Text, nullable=True))

def downgrade():
    op.drop_table('payment_events')
    op.drop_table('wallet_transactions')
    op.drop_table('wallets')
    op.drop_column('payment_intents', 'amount')
    op.drop_column('payment_intents', 'currency')
    op.drop_column('financial_transactions', 'wallet_id')
    op.drop_column('financial_transactions', 'gross_amount')
    op.drop_column('financial_transactions', 'platform_fee')
    op.drop_column('financial_transactions', 'provider_fee')
    op.drop_column('withdrawals', 'wallet_id')
    op.drop_column('withdrawals', 'currency')
    op.drop_column('withdrawals', 'reason')
