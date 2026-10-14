"""phase2_notifications_messaging_saved_alerts

Revision ID: 3354a2dad2da
Revises: 4b48073e1bd6
Create Date: 2026-10-12 21:11:30.663840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3354a2dad2da'
down_revision: Union[str, Sequence[str], None] = '4b48073e1bd6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. notifications
    if 'notifications' not in existing_tables:
        op.create_table(
            'notifications',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('resource_type', sa.String(length=50), nullable=True),
            sa.Column('resource_id', sa.String(length=36), nullable=True),
            sa.Column('link_url', sa.String(length=250), nullable=True),
            sa.Column('is_read', sa.Boolean(), nullable=False, default=False),
            sa.Column('read_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
        )
        op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
        op.create_index('ix_notifications_type', 'notifications', ['type'])
        op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])
        op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'is_read'])

    # 2. conversations
    if 'conversations' not in existing_tables:
        op.create_table(
            'conversations',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('engagement_id', sa.String(length=36), sa.ForeignKey('engagements.id', ondelete='CASCADE'), nullable=True),
            sa.Column('brief_id', sa.String(length=36), sa.ForeignKey('briefs.id', ondelete='CASCADE'), nullable=True),
            sa.Column('brand_id', sa.String(length=36), sa.ForeignKey('brand_profiles.id', ondelete='CASCADE'), nullable=False),
            sa.Column('creator_id', sa.String(length=36), sa.ForeignKey('creator_profiles.id', ondelete='CASCADE'), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
        )
        op.create_index('ix_conversations_engagement_id', 'conversations', ['engagement_id'])
        op.create_index('ix_conversations_brief_id', 'conversations', ['brief_id'])
        op.create_index('ix_conversations_brand_id', 'conversations', ['brand_id'])
        op.create_index('ix_conversations_creator_id', 'conversations', ['creator_id'])
        op.create_index('ix_conversations_updated_at', 'conversations', ['updated_at'])

    # 3. messages
    if 'messages' not in existing_tables:
        op.create_table(
            'messages',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('conversation_id', sa.String(length=36), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
            sa.Column('sender_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('is_read', sa.Boolean(), nullable=False, default=False),
            sa.Column('read_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
        )
        op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])
        op.create_index('ix_messages_sender_id', 'messages', ['sender_id'])
        op.create_index('ix_messages_created_at', 'messages', ['created_at'])

    # 4. saved_creators
    if 'saved_creators' not in existing_tables:
        op.create_table(
            'saved_creators',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('creator_id', sa.String(length=36), sa.ForeignKey('creator_profiles.id', ondelete='CASCADE'), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.UniqueConstraint('user_id', 'creator_id', name='uq_user_saved_creator'),
        )
        op.create_index('ix_saved_creators_user_id', 'saved_creators', ['user_id'])
        op.create_index('ix_saved_creators_creator_id', 'saved_creators', ['creator_id'])

    # 5. saved_briefs
    if 'saved_briefs' not in existing_tables:
        op.create_table(
            'saved_briefs',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('brief_id', sa.String(length=36), sa.ForeignKey('briefs.id', ondelete='CASCADE'), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.UniqueConstraint('user_id', 'brief_id', name='uq_user_saved_brief'),
        )
        op.create_index('ix_saved_briefs_user_id', 'saved_briefs', ['user_id'])
        op.create_index('ix_saved_briefs_brief_id', 'saved_briefs', ['brief_id'])

    # 6. alert_preferences
    if 'alert_preferences' not in existing_tables:
        op.create_table(
            'alert_preferences',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),
            sa.Column('is_enabled', sa.Boolean(), nullable=False, default=True),
            sa.Column('min_budget', sa.Float(), nullable=True),
            sa.Column('preferred_categories', sa.JSON(), nullable=True),
            sa.Column('preferred_content_types', sa.JSON(), nullable=True),
            sa.Column('email_alerts_enabled', sa.Boolean(), nullable=False, default=True),
            sa.Column('in_app_alerts_enabled', sa.Boolean(), nullable=False, default=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
        )
        op.create_index('ix_alert_preferences_user_id', 'alert_preferences', ['user_id'])

    # 7. opportunity_alerts
    if 'opportunity_alerts' not in existing_tables:
        op.create_table(
            'opportunity_alerts',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('brief_id', sa.String(length=36), sa.ForeignKey('briefs.id', ondelete='CASCADE'), nullable=False),
            sa.Column('match_score', sa.Float(), nullable=False),
            sa.Column('match_reasons', sa.JSON(), nullable=False),
            sa.Column('is_viewed', sa.Boolean(), nullable=False, default=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.UniqueConstraint('user_id', 'brief_id', name='uq_user_brief_alert'),
        )
        op.create_index('ix_opportunity_alerts_user_id', 'opportunity_alerts', ['user_id'])
        op.create_index('ix_opportunity_alerts_brief_id', 'opportunity_alerts', ['brief_id'])
        op.create_index('ix_opportunity_alerts_created_at', 'opportunity_alerts', ['created_at'])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    for table_name in [
        'opportunity_alerts',
        'alert_preferences',
        'saved_briefs',
        'saved_creators',
        'messages',
        'conversations',
        'notifications',
    ]:
        if table_name in existing_tables:
            op.drop_table(table_name)
