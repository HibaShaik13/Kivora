"""phase3_workspace_milestones_reviews

Revision ID: 6a89c2f1e40b
Revises: 3354a2dad2da
Create Date: 2026-10-12 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a89c2f1e40b'
down_revision: Union[str, Sequence[str], None] = '3354a2dad2da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. engagement_milestones
    if 'engagement_milestones' not in existing_tables:
        op.create_table(
            'engagement_milestones',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('engagement_id', sa.String(length=36), sa.ForeignKey('engagements.id', ondelete='CASCADE'), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('due_date', sa.DateTime(), nullable=True),
            sa.Column('status', sa.String(length=30), nullable=False, server_default='PENDING'),
            sa.Column('sequence_order', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('responsible_party', sa.String(length=30), nullable=False, server_default='CREATOR'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
        )
        op.create_index('ix_engagement_milestones_engagement_id', 'engagement_milestones', ['engagement_id'])
        op.create_index('ix_engagement_milestones_status', 'engagement_milestones', ['status'])

    # 2. Add additive columns to engagement_deliverables
    existing_deliv_cols = [c['name'] for c in inspector.get_columns('engagement_deliverables')]
    with op.batch_alter_table('engagement_deliverables') as batch_op:
        if 'file_storage_key' not in existing_deliv_cols:
            batch_op.add_column(sa.Column('file_storage_key', sa.String(length=500), nullable=True))
        if 'original_filename' not in existing_deliv_cols:
            batch_op.add_column(sa.Column('original_filename', sa.String(length=255), nullable=True))
        if 'file_size_bytes' not in existing_deliv_cols:
            batch_op.add_column(sa.Column('file_size_bytes', sa.Integer(), nullable=True))
        if 'content_type' not in existing_deliv_cols:
            batch_op.add_column(sa.Column('content_type', sa.String(length=100), nullable=True))
        if 'sha256_checksum' not in existing_deliv_cols:
            batch_op.add_column(sa.Column('sha256_checksum', sa.String(length=64), nullable=True))
        if 'milestone_id' not in existing_deliv_cols:
            batch_op.add_column(sa.Column('milestone_id', sa.String(length=36), nullable=True))

    # 3. engagement_events
    if 'engagement_events' not in existing_tables:
        op.create_table(
            'engagement_events',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('engagement_id', sa.String(length=36), sa.ForeignKey('engagements.id', ondelete='CASCADE'), nullable=False),
            sa.Column('event_type', sa.String(length=50), nullable=False),
            sa.Column('actor_id', sa.String(length=36), nullable=False),
            sa.Column('actor_role', sa.String(length=20), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('event_metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
        )
        op.create_index('ix_engagement_events_engagement_id', 'engagement_events', ['engagement_id'])
        op.create_index('ix_engagement_events_event_type', 'engagement_events', ['event_type'])
        op.create_index('ix_engagement_events_created_at', 'engagement_events', ['created_at'])

    # 4. deliverable_ai_analyses
    if 'deliverable_ai_analyses' not in existing_tables:
        op.create_table(
            'deliverable_ai_analyses',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('deliverable_id', sa.String(length=36), sa.ForeignKey('engagement_deliverables.id', ondelete='CASCADE'), nullable=False),
            sa.Column('version', sa.Integer(), nullable=False),
            sa.Column('brief_coverage_score', sa.Float(), nullable=False),
            sa.Column('summary', sa.Text(), nullable=False),
            sa.Column('requirement_coverage', sa.JSON(), nullable=False),
            sa.Column('potential_omissions', sa.JSON(), nullable=False),
            sa.Column('consistency_notes', sa.JSON(), nullable=False),
            sa.Column('quality_observations', sa.JSON(), nullable=False),
            sa.Column('suggested_questions', sa.JSON(), nullable=False),
            sa.Column('recommended_checks', sa.JSON(), nullable=False),
            sa.Column('model_name', sa.String(length=100), nullable=False),
            sa.Column('analysis_status', sa.String(length=30), nullable=False, server_default='COMPLETED'),
            sa.Column('disclaimer', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
        )
        op.create_index('ix_deliverable_ai_analyses_deliverable_id', 'deliverable_ai_analyses', ['deliverable_id'])

    # 5. engagement_reviews
    if 'engagement_reviews' not in existing_tables:
        op.create_table(
            'engagement_reviews',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('engagement_id', sa.String(length=36), sa.ForeignKey('engagements.id', ondelete='CASCADE'), nullable=False),
            sa.Column('reviewer_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('reviewer_role', sa.String(length=20), nullable=False),
            sa.Column('reviewee_id', sa.String(length=36), nullable=False),
            sa.Column('reviewee_role', sa.String(length=20), nullable=False),
            sa.Column('rating', sa.Float(), nullable=False),
            sa.Column('review_text', sa.Text(), nullable=True),
            sa.Column('communication_rating', sa.Float(), nullable=True),
            sa.Column('quality_rating', sa.Float(), nullable=True),
            sa.Column('timeliness_rating', sa.Float(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.UniqueConstraint('engagement_id', 'reviewer_id', name='uq_engagement_reviewer'),
        )
        op.create_index('ix_engagement_reviews_engagement_id', 'engagement_reviews', ['engagement_id'])
        op.create_index('ix_engagement_reviews_reviewer_id', 'engagement_reviews', ['reviewer_id'])
        op.create_index('ix_engagement_reviews_reviewee_id', 'engagement_reviews', ['reviewee_id'])


def downgrade() -> None:
    op.drop_table('engagement_reviews')
    op.drop_table('deliverable_ai_analyses')
    op.drop_table('engagement_events')

    with op.batch_alter_table('engagement_deliverables') as batch_op:
        batch_op.drop_column('milestone_id')
        batch_op.drop_column('sha256_checksum')
        batch_op.drop_column('content_type')
        batch_op.drop_column('file_size_bytes')
        batch_op.drop_column('original_filename')
        batch_op.drop_column('file_storage_key')

    op.drop_table('engagement_milestones')
