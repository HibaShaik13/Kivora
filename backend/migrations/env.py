import os
import sys
from pathlib import Path
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure repository root and backend directory are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import backend.app.core.config
from backend.app.database import DATABASE_URL
from backend.app.models.models import Base

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target declarative metadata for autogenerate support
target_metadata = Base.metadata


def get_url():
    if os.getenv("ALEMBIC_DATABASE_URL"):
        return os.getenv("ALEMBIC_DATABASE_URL")
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    url = DATABASE_URL
    # Ensure SQLite paths work when running from backend directory
    if url.startswith("sqlite:///./") and not os.path.exists("./kivora.db") and os.path.exists("../kivora.db"):
        return "sqlite:///../kivora.db"
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    db_url = get_url()
    configuration["sqlalchemy.url"] = db_url

    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
