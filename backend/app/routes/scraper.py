from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter(prefix="/api/scraper", tags=["scraper"])


@router.post("/run")
def run_scraper(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    from scraper.run import scrape_all
    background_tasks.add_task(scrape_all)
    return {"status": "started"}
