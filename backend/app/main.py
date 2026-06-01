from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routes.clips import router as clips_router
from .routes.scraper import router as scraper_router

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
