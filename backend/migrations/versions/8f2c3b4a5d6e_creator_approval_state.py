"""creator_approval_state

Revision ID: 8f2c3b4a5d6e
Revises: 6a89c2f1e40b
Create Date: 2026-10-23 19:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f2c3b4a5d6e'
down_revision: Union[str, Sequence[str], None] = '6a89c2f1e40b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [c['name'] for c in inspector.get_columns('creator_profiles')]

    if 'approval_status' not in existing_cols:
        # Non-destructive column addition that avoids SQLite table drop/recreate
        bind.execute(
            sa.text(
                "ALTER TABLE creator_profiles ADD COLUMN approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'"
            )
        )
        bind.execute(
            sa.text(
                "CREATE INDEX IF NOT EXISTS ix_creator_profiles_approval_status ON creator_profiles (approval_status)"
            )
        )

        # Phase 02A.3 Audited Multi-Pass Backfill with Correlated NOT EXISTS Protection
        # Prevents overwriting manual admin decisions or resubmissions upon any forced rerun.

        # Pass 1: Explicit Historical Rejections (cr-synth-004, cr-synth-005)
        bind.execute(
            sa.text(
                "UPDATE creator_profiles "
                "SET approval_status = 'REJECTED' "
                "WHERE id IN ('cr-synth-004', 'cr-synth-005') "
                "  AND NOT EXISTS ("
                "      SELECT 1 FROM notifications n "
                "      WHERE n.user_id = creator_profiles.user_id "
                "        AND n.type IN ('CREATOR_APPROVAL', 'CREATOR_PROFILE_SUBMITTED')"
                "  )"
            )
        )

        # Pass 2: Explicit Historical Approvals (cr-synth-003)
        bind.execute(
            sa.text(
                "UPDATE creator_profiles "
                "SET approval_status = 'APPROVED' "
                "WHERE id = 'cr-synth-003' "
                "  AND NOT EXISTS ("
                "      SELECT 1 FROM notifications n "
                "      WHERE n.user_id = creator_profiles.user_id "
                "        AND n.type IN ('CREATOR_REJECTION', 'CREATOR_PROFILE_SUBMITTED')"
                "  )"
            )
        )

        # Pass 3: Aria Vance Legacy Compatibility (preserves client contracts)
        bind.execute(
            sa.text(
                "UPDATE creator_profiles "
                "SET approval_status = 'LEGACY_ACTIVE' "
                "WHERE id = 'cr-synth-001' "
                "  AND NOT EXISTS ("
                "      SELECT 1 FROM notifications n "
                "      WHERE n.user_id = creator_profiles.user_id "
                "        AND n.type IN ('CREATOR_APPROVAL', 'CREATOR_REJECTION', 'CREATOR_PROFILE_SUBMITTED')"
                "  )"
            )
        )

        # Pass 4: Genuine Registered Human Users
        bind.execute(
            sa.text(
                "UPDATE creator_profiles "
                "SET approval_status = 'LEGACY_ACTIVE' "
                "WHERE id IN ('creator-4398746489', 'cr-7db989c3ae99', 'cr-bb0c884763ba', 'cr-b6771ed9cf01', 'cr-6775472d41e9') "
                "  AND NOT EXISTS ("
                "      SELECT 1 FROM notifications n "
                "      WHERE n.user_id = creator_profiles.user_id "
                "        AND n.type IN ('CREATOR_APPROVAL', 'CREATOR_REJECTION', 'CREATOR_PROFILE_SUBMITTED')"
                "  )"
            )
        )

        # Pass 5: Synthetic Expansion Inventory (cr-synth-006 to cr-synth-105)
        # Strict exclusions: 001, 002, 003, 004, 005
        bind.execute(
            sa.text(
                "UPDATE creator_profiles "
                "SET approval_status = 'LEGACY_ACTIVE' "
                "WHERE id LIKE 'cr-synth-%' "
                "  AND id NOT IN ('cr-synth-001', 'cr-synth-002', 'cr-synth-003', 'cr-synth-004', 'cr-synth-005') "
                "  AND NOT EXISTS ("
                "      SELECT 1 FROM notifications n "
                "      WHERE n.user_id = creator_profiles.user_id "
                "        AND n.type IN ('CREATOR_APPROVAL', 'CREATOR_REJECTION', 'CREATOR_PROFILE_SUBMITTED')"
                "  )"
            )
        )

        # Pass 6: Seed Phase 0 Demo Inventory (12 foundational creators, excluding Kai and Nora)
        bind.execute(
            sa.text(
                "UPDATE creator_profiles "
                "SET approval_status = 'LEGACY_ACTIVE' "
                "WHERE id IN ("
                "    'creator-alex-rivera', 'creator-zara-chen', 'creator-devon-ross',"
                "    'creator-tariq-mansoor', 'creator-chloe-dupont', 'creator-liam-obrien',"
                "    'creator-ananya-sharma', 'creator-elena-rostova', 'creator-marcus-vance',"
                "    'creator-maya-lin', 'creator-sophia-dubois', 'creator-hassan-khalil'"
                ") "
                "AND NOT EXISTS ("
                "    SELECT 1 FROM notifications n "
                "    WHERE n.user_id = creator_profiles.user_id "
                "      AND n.type IN ('CREATOR_APPROVAL', 'CREATOR_REJECTION', 'CREATOR_PROFILE_SUBMITTED')"
                ")"
            )
        )

        # Pass 7: Strict Enforcement of PENDING Exceptions and Test/OAuth Fixtures
        bind.execute(
            sa.text(
                "UPDATE creator_profiles "
                "SET approval_status = 'PENDING' "
                "WHERE (id IN ('cr-synth-002', 'creator-kai-tanaka', 'creator-nora-lindqvist') "
                "   OR handle LIKE 'test_%' "
                "   OR handle LIKE 'google_test_%' "
                "   OR handle LIKE 'octocat_%' "
                "   OR handle LIKE 'audit_test_%') "
                "  AND approval_status NOT IN ('APPROVED', 'REJECTED') "
                "  AND NOT EXISTS ("
                "      SELECT 1 FROM notifications n "
                "      WHERE n.user_id = creator_profiles.user_id "
                "        AND n.type IN ('CREATOR_APPROVAL', 'CREATOR_REJECTION')"
                "  )"
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = [c['name'] for c in inspector.get_columns('creator_profiles')]

    if 'approval_status' in existing_cols:
        bind.execute(sa.text("DROP INDEX IF EXISTS ix_creator_profiles_approval_status"))
        bind.execute(sa.text("ALTER TABLE creator_profiles DROP COLUMN approval_status"))
