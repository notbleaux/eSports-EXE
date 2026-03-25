"""Add player_stats table for SimRating v2 data.

Revision ID: 002_player_stats
Revises: 001_initial_schema
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "002_player_stats"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "player_stats",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("match_id", sa.Integer(), sa.ForeignKey("matches.id"), nullable=True),
        sa.Column("game", sa.String(20), nullable=False),
        sa.Column("kills", sa.Integer(), nullable=True, default=0),
        sa.Column("deaths", sa.Integer(), nullable=True, default=0),
        sa.Column("assists", sa.Integer(), nullable=True, default=0),
        sa.Column("headshot_pct", sa.Float(), nullable=True, default=0.0),
        sa.Column("first_bloods", sa.Integer(), nullable=True, default=0),
        sa.Column("clutches_won", sa.Integer(), nullable=True, default=0),
        sa.Column("rounds_played", sa.Integer(), nullable=True, default=0),
        sa.Column("kd_ratio", sa.Float(), nullable=True, default=0.0),
        sa.Column("acs", sa.Float(), nullable=True, default=0.0),
        sa.Column("recorded_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_player_stats_player_id", "player_stats", ["player_id"])
    op.create_index("ix_player_stats_game", "player_stats", ["game"])


def downgrade() -> None:
    op.drop_index("ix_player_stats_game", table_name="player_stats")
    op.drop_index("ix_player_stats_player_id", table_name="player_stats")
    op.drop_table("player_stats")
