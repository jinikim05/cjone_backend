"""
mission_backend.py

기능
1) 매일 자정: Supabase(user_feature_30d + user_mission_pool 최근 7일 completed) -> Mission API 호출 -> 추천 3개 반환
2) 유저가 추천 미션 중 완료 처리: Supabase(user_mission_pool)에 status/completed_at/exclude_mission_ids 누적 저장

.env (별도)
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
MISSION_API_URL=...
MISSION_API_KEY=...

requirements.txt (별도)
supabase
python-dotenv
requests
pandas
numpy
"""

from __future__ import annotations

import os
import json
from datetime import datetime, date, timedelta, timezone
from typing import Any, Dict, List, Optional, Union

import requests
import numpy as np
from dotenv import load_dotenv
from supabase import create_client

# fast api 로드... (추후 API 서버로 확장 시 사용)
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import uvicorn

import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY")

load_dotenv()
app = FastAPI()

# =========================
# Supabase 연결
# =========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_KEY 가 .env에 없습니다.")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# =========================
# Mission API 설정
# =========================
MISSION_API_URL = os.getenv("MISSION_API_URL")
MISSION_API_KEY = os.getenv("MISSION_API_KEY")

if not MISSION_API_URL or not MISSION_API_KEY:
    raise RuntimeError("MISSION_API_URL / MISSION_API_KEY 가 .env에 없습니다.")


def _mission_headers() -> Dict[str, str]:
    return {"Content-Type": "application/json", "x-api-key": MISSION_API_KEY}


# =========================
# 시간/유틸
# =========================
KST = timezone(timedelta(hours=9))


def _now_kst() -> datetime:
    return datetime.now(tz=KST)


def _now_kst_str() -> str:
    return _now_kst().strftime("%Y-%m-%d %H:%M:%S")


def _to_date_str(d: Union[str, date, datetime, None]) -> str:
    if d is None:
        return date.today().isoformat()
    if isinstance(d, date) and not isinstance(d, datetime):
        return d.isoformat()
    if isinstance(d, datetime):
        return d.date().isoformat()
    return str(d)


def _clean_jsonable(obj: Any) -> Any:
    if obj is None:
        return None
    if isinstance(obj, float) and np.isnan(obj):
        return None
    if isinstance(obj, (np.floating, np.integer)):
        return obj.item()
    if isinstance(obj, dict):
        return {str(k): _clean_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean_jsonable(v) for v in obj]
    return obj


def _unique_str_list(values: List[Any]) -> List[str]:
    out: List[str] = []
    seen = set()
    for v in values:
        if v is None:
            continue
        s = str(v).strip()
        if not s:
            continue
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


# =========================
# 1) user_feature_30d 조회
# =========================
def fetch_latest_user_feature(user_id: str) -> Dict[str, Any]:
    resp = (
        sb.table("user_feature_30d")
        .select("*")
        .eq("user_id", user_id)
        .order("snapshot_date", desc=True)
        .limit(1)
        .execute()
    )

    rows = resp.data or []
    if not rows:
        raise ValueError(f"user_feature_30d not found for user_id={user_id}")

    return _clean_jsonable(rows[0])


# =========================
# 2) 최근 7일 completed 기준 exclude_mission_ids 수집
# =========================
def fetch_exclude_mission_ids_last_7d(
    user_id: str,
    *,
    days: int = 7,
    now_kst: Optional[datetime] = None,
) -> List[str]:
    """
    completed_at(타임스탬프) 기준으로 최근 days일 동안 완료된 row들의 exclude_mission_ids를 합쳐서 반환
    - status='completed' 조건 사용
    - completed_at이 null인 row는 자동으로 제외됨
    """
    now_kst = now_kst or _now_kst()
    start_kst = now_kst - timedelta(days=days)

    # Supabase timestamp 비교용 문자열 (타임존 포함 ISO)
    # 예: 2026-02-26T00:00:00+09:00
    start_iso = start_kst.isoformat()

    resp = (
        sb.table("user_mission_pool")
        .select("exclude_mission_ids,completed_at,status")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .gte("completed_at", start_iso)
        .execute()
    )

    rows = resp.data or []
    collected: List[Any] = []
    for r in rows:
        ex = r.get("exclude_mission_ids")
        if isinstance(ex, list):
            collected.extend(ex)
        elif ex is not None:
            collected.append(ex)

    return _unique_str_list(collected)


# =========================
# 3) Mission API 호출
# =========================
def call_mission_api(
    *,
    user_id: str,
    k: int = 3,
    exclude_days: int = 7,
    timeout_sec: int = 60,
) -> Dict[str, Any]:
    feature = fetch_latest_user_feature(user_id)

    exclude_ids = fetch_exclude_mission_ids_last_7d(
        user_id,
        days=exclude_days,
    )

    payload_input = {
        "user_id": feature.get("user_id") or user_id,
        "segment_id": feature.get("segment_id"),
        "gender": feature.get("gender"),
        "age_band": feature.get("age_band"),
        "channel_mobile_share": feature.get("channel_mobile_share", 0.0),
        "channel_online_share": feature.get("channel_online_share", 0.0),
        "channel_offline_share": feature.get("channel_offline_share", 0.0),
        "domain_beauty_share": feature.get("domain_beauty_share", 0.0),
        "domain_food_share": feature.get("domain_food_share", 0.0),
        "domain_entertainment_share": feature.get("domain_entertainment_share", 0.0),
        "domain_commerce_share": feature.get("domain_commerce_share", 0.0),
        "domain_general_share": feature.get("domain_general_share", 0.0),
        "avg_amount": feature.get("avg_amount", 0.0),
        "use_ratio": feature.get("use_ratio", 0.0),
        "k": int(k),
        "exclude_mission_ids": exclude_ids,
    }

    payload_input = _clean_jsonable(payload_input)

    r = requests.post(
        MISSION_API_URL,
        json=payload_input,
        headers=_mission_headers(),
        timeout=timeout_sec,
    )

    if r.status_code != 200:
        raise RuntimeError(f"Mission API error: status={r.status_code}, body={r.text}")

    return r.json()


# =========================
# 4) 완료 처리 저장 (user_mission_pool)
# =========================
def save_mission_completion(
    *,
    user_id: str,
    date_str: Union[str, date, datetime],
    completed_mission_ids: List[Union[str, int]],
    completed_at: Optional[str] = None,
) -> Dict[str, Any]:
    """
    완료 시 user_mission_pool에 저장/누적
    - user_id + date 기준으로 row 1개를 유지하고 exclude_mission_ids를 누적하는 방식
    - status='completed', completed_at 저장

    주의
    - user_mission_pool의 upsert가 잘 되려면 보통 (user_id, date)로 unique/pk가 잡혀있는 게 안전함
    """
    d = _to_date_str(date_str)
    completed_at = completed_at or _now_kst_str()
    add_ids = _unique_str_list(completed_mission_ids)

    existing = (
        sb.table("user_mission_pool")
        .select("exclude_mission_ids")
        .eq("user_id", user_id)
        .eq("date", d)
        .limit(1)
        .execute()
    )

    prev_ids: List[str] = []
    rows = existing.data or []
    if rows:
        ex = rows[0].get("exclude_mission_ids")
        if isinstance(ex, list):
            prev_ids = _unique_str_list(ex)
        elif ex is not None:
            prev_ids = _unique_str_list([ex])

    merged = _unique_str_list(prev_ids + add_ids)

    upsert_row = {
        "user_id": user_id,
        "date": d,
        "exclude_mission_ids": merged,
        "status": "completed",
        "completed_at": completed_at,
    }

    res = sb.table("user_mission_pool").upsert(upsert_row).execute()
    return {"saved": upsert_row, "supabase": res.data}

# =========================
# 6) FastAPI Endpoints (프론트 연결용)
# =========================

def _check_api_key(x_api_key: Optional[str]):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API_KEY is not set in .env")
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")


class RecommendRequest(BaseModel):
    user_id: str
    k: int = 3
    exclude_days: int = 7


@app.post("/missions/recommend")
def missions_recommend(req: RecommendRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    return call_mission_api(user_id=req.user_id, k=req.k, exclude_days=req.exclude_days)


class CompleteRequest(BaseModel):
    user_id: str
    date_str: str
    completed_mission_ids: List[Union[str, int]]
    completed_at: Optional[str] = None


@app.post("/missions/complete")
def missions_complete(req: CompleteRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    return save_mission_completion(
        user_id=req.user_id,
        date_str=req.date_str,
        completed_mission_ids=req.completed_mission_ids,
        completed_at=req.completed_at,
    )

# =========================
# 5) 실행 테스트
# =========================
if __name__ == "__main__":
    print("=== Mission 추천 테스트 (최근 7일 exclude) ===")
    rec = call_mission_api(user_id="U000001", k=3, exclude_days=7)
    print(json.dumps(rec, ensure_ascii=False, indent=2))

    print("\n=== Mission 완료 저장 테스트 ===")
    saved = save_mission_completion(
        user_id="U000001",
        date_str="2026-02-24",
        completed_mission_ids=[10],
        completed_at="2026-02-24 21:53:00",
    )
    print(json.dumps(saved, ensure_ascii=False, indent=2))