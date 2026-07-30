"""merge multiple heads

Revision ID: 0012_merge_heads
Revises: 0011_payment_core, 41dfd21146d6
Create Date: 2026-07-30

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0012_merge_heads'
down_revision = ('0011_payment_core', '41dfd21146d6')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
