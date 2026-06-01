"""Clear all clip titles so the auto-namer re-generates them with the updated prompt."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import Clip

db = SessionLocal()
count = db.query(Clip).update({Clip.title: None})
db.commit()
db.close()
print(f"Cleared titles on {count} clips")
