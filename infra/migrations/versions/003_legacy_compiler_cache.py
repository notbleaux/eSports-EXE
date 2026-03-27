"""Create Legacy Compiler cache tables

Revision ID: 003
Revises: 002
Create Date: 2026-03-27 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create scraper_cache table
    op.create_table(
        'scraper_cache',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('url_hash', sa.String(255), nullable=False, unique=True),
        sa.Column('source_type', sa.String(100), nullable=False),  # vlr, liquidpedia, youtube
        sa.Column('cached_data', sa.JSON(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('accessed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes for scraper_cache
    op.create_index('idx_scraper_cache_url_hash', 'scraper_cache', ['url_hash'])
    op.create_index('idx_scraper_cache_expires_at', 'scraper_cache', ['expires_at'])
    op.create_index('idx_scraper_cache_source_type', 'scraper_cache', ['source_type'])
    op.create_index('idx_scraper_cache_accessed_at', 'scraper_cache', ['accessed_at'])

    # Create scraper_requests_log table
    op.create_table(
        'scraper_requests_log',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('source_type', sa.String(100), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('error_msg', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes for scraper_requests_log
    op.create_index('idx_scraper_requests_log_source_type', 'scraper_requests_log', ['source_type'])
    op.create_index('idx_scraper_requests_log_timestamp', 'scraper_requests_log', ['timestamp'])
    op.create_index('idx_scraper_requests_log_success', 'scraper_requests_log', ['success'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_scraper_requests_log_success')
    op.drop_index('idx_scraper_requests_log_timestamp')
    op.drop_index('idx_scraper_requests_log_source_type')

    op.drop_index('idx_scraper_cache_accessed_at')
    op.drop_index('idx_scraper_cache_source_type')
    op.drop_index('idx_scraper_cache_expires_at')
    op.drop_index('idx_scraper_cache_url_hash')

    # Drop tables
    op.drop_table('scraper_requests_log')
    op.drop_table('scraper_cache')
