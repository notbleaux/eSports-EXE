"""Add users and oauth_accounts tables for platform authentication.

Revision ID: 004_auth_users_oauth_accounts
Revises: 003_sim_calculations
Create Date: 2026-03-26
"""
from alembic import op
import sqlalchemy as sa

revision = "004_auth_users_oauth_accounts"
down_revision = "003_sim_calculations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "oauth_accounts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(30), nullable=False),
        sa.Column("provider_account_id", sa.String(255), nullable=False),
        sa.Column("provider_email", sa.String(255), nullable=True),
        sa.Column("provider_username", sa.String(100), nullable=True),
        sa.Column("provider_avatar_url", sa.String(500), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_account_id", name="uq_oauth_provider_account"),
    )
    op.create_index("ix_oauth_accounts_user_id", "oauth_accounts", ["user_id"])
    op.create_index("ix_oauth_accounts_provider", "oauth_accounts", ["provider", "provider_account_id"])


def downgrade() -> None:
    op.drop_index("ix_oauth_accounts_provider", table_name="oauth_accounts")
    op.drop_index("ix_oauth_accounts_user_id", table_name="oauth_accounts")
    op.drop_table("oauth_accounts")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
