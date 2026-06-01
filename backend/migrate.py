"""Run once after deploying to add start_offset column to existing DB."""
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE clips ADD COLUMN IF NOT EXISTS start_offset INTEGER DEFAULT 0"))
    conn.commit()
    print("Migration complete: start_offset column added")
