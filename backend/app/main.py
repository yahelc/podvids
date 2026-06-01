from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .database import engine
from .models import Base
from .routes.clips import router as clips_router
from .routes.scraper import router as scraper_router
from .routes.name import router as name_router, name_untitled_clips
import threading

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=name_untitled_clips, daemon=True).start()
    yield


app = FastAPI(title="PodVids", lifespan=lifespan)

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
