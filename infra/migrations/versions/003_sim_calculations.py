"""Add sim_calculations audit table for SimRating history.

Revision ID: 003_sim_calculations
Revises: 002_player_stats
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "003_sim_calculations"
down_revision = "002_player_stats"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sim_calculations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("player_id", sa.Integer(), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("game", sa.String(20), nullable=False),
        sa.Column("simrating", sa.Float(), nullable=False),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("kd_score", sa.Float(), nullable=True, default=0.0),
        sa.Column("acs_score", sa.Float(), nullable=True, default=0.0),
        sa.Column("consistency_score", sa.Float(), nullable=True, default=0.0),
        sa.Column("precision_score", sa.Float(), nullable=True, default=0.0),
        sa.Column("grade", sa.String(2), nullable=False),
        sa.Column("games_sampled", sa.Integer(), nullable=True, default=0),
        sa.Column("components", sa.JSON(), nullable=True),
        sa.Column("calculated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sim_calc_player_id", "sim_calculations", ["player_id"])
    op.create_index("ix_sim_calc_calculated_at", "sim_calculations", ["calculated_at"])


def downgrade() -> None:
    op.drop_index("ix_sim_calc_calculated_at", table_name="sim_calculations")
    op.drop_index("ix_sim_calc_player_id", table_name="sim_calculations")
    op.drop_table("sim_calculations")
