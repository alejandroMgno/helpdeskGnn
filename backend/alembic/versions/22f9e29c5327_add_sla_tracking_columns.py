"""add_sla_tracking_columns

Revision ID: 22f9e29c5327
Revises: 16d58e0f27a9
Create Date: 2026-06-01 09:31:54.036320

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '22f9e29c5327'
down_revision: Union[str, Sequence[str], None] = '16d58e0f27a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Crear nuevas tablas para seguimiento
    op.create_table('historial_status_tecnicos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tecnico_id', sa.Integer(), nullable=False),
        sa.Column('status_anterior', sa.String(length=50), nullable=True),
        sa.Column('status_nuevo', sa.String(length=50), nullable=True),
        sa.Column('fecha_cambio', sa.DateTime(), nullable=True),
        sa.Column('duracion_estimada_minutos', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['tecnico_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_historial_status_tecnicos_id'), 'historial_status_tecnicos', ['id'], unique=False)
    
    op.create_table('ticket_timeline',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ticket_id', sa.Integer(), nullable=False),
        sa.Column('evento', sa.String(length=100), nullable=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('fecha', sa.DateTime(), nullable=True),
        sa.Column('metadata_extra', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ticket_timeline_id'), 'ticket_timeline', ['id'], unique=False)

    # 2. Modificar tabla de tickets (Surgically)
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        # Añadir columnas si no existen (batch_op.add_column es seguro en SQLite)
        batch_op.add_column(sa.Column('fecha_primera_respuesta', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('tiempo_pausado_acumulado', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('ultima_fecha_pausa', sa.DateTime(), nullable=True))
        
        # Cambiar tipo de estatus y nulabilidad de fecha_vencimiento_sla
        batch_op.alter_column('fecha_vencimiento_sla',
               existing_type=sa.DATETIME(),
               nullable=True)
        batch_op.alter_column('estatus',
               existing_type=sa.VARCHAR(length=11),
               type_=sa.String(length=50), # Usamos String genérico para evitar problemas de Enum en SQLite
               existing_nullable=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_ticket_timeline_id'), table_name='ticket_timeline')
    op.drop_table('ticket_timeline')
    op.drop_index(op.f('ix_historial_status_tecnicos_id'), table_name='historial_status_tecnicos')
    op.drop_table('historial_status_tecnicos')
    
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.drop_column('ultima_fecha_pausa')
        batch_op.drop_column('tiempo_pausado_acumulado')
        batch_op.drop_column('fecha_primera_respuesta')
        batch_op.alter_column('fecha_vencimiento_sla',
               existing_type=sa.DATETIME(),
               nullable=False)
