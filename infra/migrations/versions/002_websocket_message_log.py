"""Create WebSocket live match events tables

Revision ID: 002
Revises: 001
Create Date: 2026-03-27 14:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create live_match_events table
    op.create_table(
        'live_match_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('match_id', sa.String(255), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),  # MATCH_START, SCORE_UPDATE, ROUND_END, MATCH_END
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('source', sa.String(100), nullable=False),  # pandascore, manual, etc.
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes for live_match_events
    op.create_index('idx_live_match_events_match_id', 'live_match_events', ['match_id'])
    op.create_index('idx_live_match_events_match_id_received_at', 'live_match_events', ['match_id', 'received_at'])
    op.create_index('idx_live_match_events_event_type', 'live_match_events', ['event_type'])
    op.create_index('idx_live_match_events_received_at', 'live_match_events', ['received_at'])

    # Create websocket_subscriptions table (optional, for monitoring)
    op.create_table(
        'websocket_subscriptions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('connection_id', sa.String(255), nullable=False),
        sa.Column('match_id', sa.String(255), nullable=False),
        sa.Column('user_id', sa.String(255), nullable=True),
        sa.Column('connected_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('disconnected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes for websocket_subscriptions
    op.create_index('idx_websocket_subscriptions_connection_id', 'websocket_subscriptions', ['connection_id'])
    op.create_index('idx_websocket_subscriptions_match_id', 'websocket_subscriptions', ['match_id'])
    op.create_index('idx_websocket_subscriptions_connected_at', 'websocket_subscriptions', ['connected_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_websocket_subscriptions_connected_at')
    op.drop_index('idx_websocket_subscriptions_match_id')
    op.drop_index('idx_websocket_subscriptions_connection_id')

    op.drop_index('idx_live_match_events_received_at')
    op.drop_index('idx_live_match_events_event_type')
    op.drop_index('idx_live_match_events_match_id_received_at')
    op.drop_index('idx_live_match_events_match_id')

    # Drop tables
    op.drop_table('websocket_subscriptions')
    op.drop_table('live_match_events')
