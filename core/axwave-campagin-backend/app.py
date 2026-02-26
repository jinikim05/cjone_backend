# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

from supabase_client import (
    call_predict_api,
    save_user_club,
    leave_user_club
)

app = FastAPI()

# 🔥 개발용 CORS (나중에 도메인 제한 가능)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Request 모델 정의
# =========================

class PredictRequest(BaseModel):
    user_id: str


class SelectClubRequest(BaseModel):
    user_id: str
    club_domain: str


class LeaveClubRequest(BaseModel):
    user_id: str


# =========================
# 라우트 정의
# =========================

@app.post("/predict")
def predict_route(req: PredictRequest):
    result = call_predict_api(
        user_id=req.user_id,
        segment_id="",
        uuid_id=str(uuid.uuid4())
    )
    return result


@app.post("/select_club")
def select_club_route(req: SelectClubRequest):
    save_user_club(req.user_id, req.club_domain)
    return {"status": "ok"}


@app.post("/leave_club")
def leave_club_route(req: LeaveClubRequest):
    leave_user_club(req.user_id)
    return {"status": "ok"}