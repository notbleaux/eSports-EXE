"""Create TeneT Verification tables

Revision ID: 001
Revises:
Create Date: 2026-03-27 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create verification_records table
    op.create_table(
        'verification_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('entity_id', sa.String(255), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('game', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),  # ACCEPTED, FLAGGED, REJECTED, MANUAL_OVERRIDE
        sa.Column('confidence_value', sa.Float(), nullable=False),
        sa.Column('confidence_breakdown', sa.JSON(), nullable=True),
        sa.Column('conflict_fields', sa.JSON(), nullable=True),
        sa.Column('distribution_path', sa.String(50), nullable=False),  # PATH_A_LIVE, PATH_B_LEGACY, BOTH, NONE
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create indexes for verification_records
    op.create_index('idx_verification_records_entity_id', 'verification_records', ['entity_id'])
    op.create_index('idx_verification_records_created_at_desc', 'verification_records', ['created_at'], unique=False)
    op.create_index('idx_verification_records_status', 'verification_records', ['status'])
    op.create_index('idx_verification_records_game', 'verification_records', ['game'])

    # Create data_source_contributions table
    op.create_table(
        'data_source_contributions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('verification_id', sa.String(36), sa.ForeignKey('verification_records.id'), nullable=False),
        sa.Column('source_type', sa.String(100), nullable=False),
        sa.Column('trust_level', sa.String(50), nullable=False),  # HIGH, MEDIUM, LOW
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('source_confidence', sa.Float(), nullable=False),
        sa.Column('data_value', sa.JSON(), nullable=True),
        sa.Column('ingested_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes for data_source_contributions
    op.create_index('idx_data_source_contributions_verification_id', 'data_source_contributions', ['verification_id'])
    op.create_index('idx_data_source_contributions_source_type', 'data_source_contributions', ['source_type'])

    # Create review_queue table
    op.create_table(
        'review_queue',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('verification_id', sa.String(36), sa.ForeignKey('verification_records.id'), nullable=False),
        sa.Column('entity_id', sa.String(255), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('game', sa.String(50), nullable=False),
        sa.Column('reason', sa.String(255), nullable=False),
        sa.Column('confidence_value', sa.Float(), nullable=False),
        sa.Column('priority', sa.String(50), nullable=False, server_default='NORMAL'),  # HIGH, NORMAL, LOW
        sa.Column('reviewer_id', sa.String(255), nullable=True),
        sa.Column('review_decision', sa.String(50), nullable=True),  # ACCEPT, REJECT, REQUEST_MORE_DATA
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('flagged_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes for review_queue
    op.create_index('idx_review_queue_verification_id', 'review_queue', ['verification_id'])
    op.create_index('idx_review_queue_flagged_at_desc', 'review_queue', ['flagged_at'])
    op.create_index('idx_review_queue_entity_id', 'review_queue', ['entity_id'])
    op.create_index('idx_review_queue_priority', 'review_queue', ['priority'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_review_queue_priority')
    op.drop_index('idx_review_queue_entity_id')
    op.drop_index('idx_review_queue_flagged_at_desc')
    op.drop_index('idx_review_queue_verification_id')

    op.drop_index('idx_data_source_contributions_source_type')
    op.drop_index('idx_data_source_contributions_verification_id')

    op.drop_index('idx_verification_records_game')
    op.drop_index('idx_verification_records_status')
    op.drop_index('idx_verification_records_created_at_desc')
    op.drop_index('idx_verification_records_entity_id')

    # Drop tables
    op.drop_table('review_queue')
    op.drop_table('data_source_contributions')
    op.drop_table('verification_records')
