from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from .database import engine
from .models import Base
from .routes.clips import router as clips_router
from .routes.scraper import router as scraper_router
from .routes.name import router as name_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PodVids")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clips_router)
app.include_router(scraper_router)
app.include_router(name_router)

# Serve built frontend — present in production, absent in dev (gracefully skipped)
_static = Path(__file__).parent / "static"
if _static.exists():
    app.mount("/", StaticFiles(directory=_static, html=True), name="static")
