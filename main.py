import uuid
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from supabase_client import call_predict_api, leave_user_club, save_user_club

import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_api_key(x_api_key: Optional[str]):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")


class PredictRequest(BaseModel):
    user_id: str


class SelectClubRequest(BaseModel):
    user_id: str
    club_domain: str


class LeaveClubRequest(BaseModel):
    user_id: str


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/predict")
def predict_route(req: PredictRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    return call_predict_api(user_id=req.user_id, segment_id="", uuid_id=str(uuid.uuid4()))


@app.post("/select_club")
def select_club_route(req: SelectClubRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    save_user_club(req.user_id, req.club_domain)
    return {"status": "ok"}


@app.post("/leave_club")
def leave_club_route(req: LeaveClubRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    leave_user_club(req.user_id)
    return {"status": "ok"}
