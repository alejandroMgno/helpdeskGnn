"""add_email_verification_fields

Revision ID: 9db175889d91
Revises: 31ac48704cd8
Create Date: 2026-06-23 13:19:04.800212

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9db175889d91'
down_revision: Union[str, Sequence[str], None] = '31ac48704cd8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('usuarios', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('email_verification_token', sa.String(length=100), nullable=True))

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('usuarios', schema=None) as batch_op:
        batch_op.drop_column('email_verification_token')
        batch_op.drop_column('is_email_verified')
