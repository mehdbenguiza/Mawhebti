"""create users and profiles tables

Revision ID: 0001_initial
Revises: 
Create Date: 2026-07-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Création de l'enum UserRole
    user_role = postgresql.ENUM(
        'TALENT_MINOR', 'TALENT_MAJOR', 'PARENT', 'RECRUITER', 'MODERATOR', 'ADMIN',
        name='userrole'
    )
    user_role.create(op.get_bind(), checkfirst=True)

    # Création de l'enum UserStatus
    user_status = postgresql.ENUM(
        'DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED',
        name='userstatus'
    )
    user_status.create(op.get_bind(), checkfirst=True)

    # Table users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(254), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('TALENT_MINOR', 'TALENT_MAJOR', 'PARENT', 'RECRUITER', 'MODERATOR', 'ADMIN', name='userrole'), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED', name='userstatus'), nullable=False, server_default='PENDING'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Table profiles
    op.create_table(
        'profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(512), nullable=True),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_profiles_user_id', 'profiles', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_table('profiles')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS userstatus")
