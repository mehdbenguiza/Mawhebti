"""messaging and recruitment v2

Revision ID: 0005_messaging_recruitment
Revises: 0004_video_stats
Create Date: 2026-07-20 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0005_messaging_recruitment'
down_revision = '0004_video_stats'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Colonnes users — on utilise IF NOT EXISTS car l'ancienne migration a pu les créer partiellement ──
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_verified_at TIMESTAMPTZ")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_level VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED'")

    # ── 2. Table recruitment_requests ──
    op.create_table(
        'recruitment_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recruiter_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_talent_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['recruiter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_talent_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_recruitment_requests_recruiter_id', 'recruitment_requests', ['recruiter_id'])
    op.create_index('ix_recruitment_requests_recipient_id', 'recruitment_requests', ['recipient_id'])
    op.create_index('ix_recruitment_requests_subject_talent_id', 'recruitment_requests', ['subject_talent_id'])

    # ── 3. Table conversations ──
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_talent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='OPEN'),
        sa.Column('recruitment_stage', sa.String(length=50), nullable=False, server_default='NEW_CONTACT'),
        sa.Column('risk_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['subject_talent_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_conversations_subject_talent_id', 'conversations', ['subject_talent_id'])

    # ── 4. Table conversation_participants ──
    op.create_table(
        'conversation_participants',
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('conversation_id', 'user_id'),
    )

    # ── 5. Table messages ──
    op.create_table(
        'messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sender_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('message_type', sa.String(length=50), nullable=False, server_default='TEXT'),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('status', sa.String(length=50), server_default='SENT'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('ix_messages_sender_id', 'messages', ['sender_id'])

    # ── 6. Table blocked_users ──
    op.create_table(
        'blocked_users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('blocked_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('blocked_user', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['blocked_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocked_user'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_blocked_users_blocked_by', 'blocked_users', ['blocked_by'])

    # ── 7. Table notifications ──
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('notification_type', sa.String(length=100), nullable=False),
        sa.Column('priority', sa.String(length=50), nullable=False, server_default='NORMAL'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('link', sa.String(length=512), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_recipient_id', 'notifications', ['recipient_id'])

    # ── 8. Table saved_talents ──
    op.create_table(
        'saved_talents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recruiter_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('talent_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['recruiter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['talent_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('recruiter_id', 'talent_id', name='uq_saved_talent'),
    )

    # ── 9. Table audit_logs ──
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_values', sa.JSON(), nullable=True),
        sa.Column('new_values', sa.JSON(), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])
    op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'])
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('saved_talents')
    op.drop_table('notifications')
    op.drop_table('blocked_users')
    op.drop_table('messages')
    op.drop_table('conversation_participants')
    op.drop_table('conversations')
    op.drop_table('recruitment_requests')
    op.drop_column('users', 'bank_verified_at')
    op.drop_column('users', 'kyc_verified_at')
    op.drop_column('users', 'phone_verified_at')
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'verification_level')
