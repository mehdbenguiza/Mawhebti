"""add trust levels and parent_email

Revision ID: 0003_trust_levels
Revises: 0002_sprint3
Create Date: 2026-07-20 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0003_trust_levels'
down_revision = '0002_sprint3'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Ajouter les champs de vérification à `users`
    op.add_column('users', sa.Column('phone_number', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('phone_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('kyc_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('bank_verified_at', sa.DateTime(timezone=True), nullable=True))

    # 2. Rendre `parent_id` nullable et ajouter `parent_email` à `parent_child_links`
    op.alter_column('parent_child_links', 'parent_id', existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    
    # Étape intermédiaire : Ajouter `parent_email` en nullable, puis le remplir, puis le rendre non-nullable
    op.add_column('parent_child_links', sa.Column('parent_email', sa.String(length=254), nullable=True))
    
    # Remplir le champ parent_email pour les liens existants en joignant la table users
    op.execute(
        """
        UPDATE parent_child_links 
        SET parent_email = users.email 
        FROM users 
        WHERE parent_child_links.parent_id = users.id
        """
    )
    
    # Rendre parent_email non-nullable
    op.alter_column('parent_child_links', 'parent_email', existing_type=sa.String(length=254), nullable=False)

def downgrade() -> None:
    # 1. Revenir en arrière sur `parent_child_links`
    op.drop_column('parent_child_links', 'parent_email')
    
    # Attention, si on remet parent_id NOT NULL, il faut s'assurer qu'il n'y a pas de nulls
    # On va les supprimer pour simplifier le downgrade (qui est rarement utilisé en prod)
    op.execute("DELETE FROM parent_child_links WHERE parent_id IS NULL")
    op.alter_column('parent_child_links', 'parent_id', existing_type=postgresql.UUID(as_uuid=True), nullable=False)

    # 2. Revenir en arrière sur `users`
    op.drop_column('users', 'bank_verified_at')
    op.drop_column('users', 'kyc_verified_at')
    op.drop_column('users', 'phone_verified_at')
    op.drop_column('users', 'phone_number')
