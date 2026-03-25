"""Initial schema: teams, players, matches tables.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'teams',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pandascore_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('slug', sa.String(200), nullable=False),
        sa.Column('acronym', sa.String(20), nullable=True),
        sa.Column('game', sa.String(20), nullable=False),
        sa.Column('region', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pandascore_id'),
        sa.UniqueConstraint('slug'),
    )

    op.create_table(
        'players',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pandascore_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('nationality', sa.String(50), nullable=True),
        sa.Column('game', sa.String(20), nullable=False),
        sa.Column('team_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pandascore_id'),
        sa.UniqueConstraint('slug'),
    )

    op.create_table(
        'matches',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pandascore_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('game', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('team1_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('team2_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('winner_id', sa.Integer(), sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pandascore_id'),
    )


def downgrade() -> None:
    op.drop_table('matches')
    op.drop_table('players')
    op.drop_table('teams')
