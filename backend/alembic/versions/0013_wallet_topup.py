"""wallet topup

Revision ID: 0013_wallet_topup
Revises: 0012_merge_heads
Create Date: 2026-07-30 20:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0013_wallet_topup'
down_revision: Union[str, None] = '0012_merge_heads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add intent_type column
    op.execute("CREATE TYPE paymentintenttype AS ENUM ('DONATION', 'TOPUP')")
    op.add_column('payment_intents', sa.Column('intent_type', sa.Enum('DONATION', 'TOPUP', name='paymentintenttype', native_enum=False, length=50), nullable=False, server_default='DONATION'))
    
    # Alter campaign_id to drop NOT NULL
    op.alter_column('payment_intents', 'campaign_id',
               existing_type=sa.UUID(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('payment_intents', 'campaign_id',
               existing_type=sa.UUID(),
               nullable=False)
    
    op.drop_column('payment_intents', 'intent_type')
    op.execute("DROP TYPE paymentintenttype")
