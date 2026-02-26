from __future__ import annotations

import os
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union

import numpy as np
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not set")
    return value


API_KEY = _required_env("API_KEY")
SUPABASE_URL = _required_env("SUPABASE_URL")
SUPABASE_SERVICE_KEY = _required_env("SUPABASE_SERVICE_KEY")
MISSION_API_URL = _required_env("MISSION_API_URL")
MISSION_API_KEY = _required_env("MISSION_API_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
KST = timezone(timedelta(hours=9))


def _mission_headers() -> Dict[str, str]:
    return {"Content-Type": "application/json", "x-api-key": MISSION_API_KEY}


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


def fetch_exclude_mission_ids_last_7d(
    user_id: str,
    *,
    days: int = 7,
    now_kst: Optional[datetime] = None,
) -> List[str]:
    now_kst = now_kst or _now_kst()
    start_kst = now_kst - timedelta(days=days)
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


def call_mission_api(
    *,
    user_id: str,
    k: int = 3,
    exclude_days: int = 7,
    timeout_sec: int = 60,
) -> Dict[str, Any]:
    feature = fetch_latest_user_feature(user_id)

    exclude_ids = fetch_exclude_mission_ids_last_7d(user_id, days=exclude_days)

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

    r = requests.post(
        MISSION_API_URL,
        json=_clean_jsonable(payload_input),
        headers=_mission_headers(),
        timeout=timeout_sec,
    )

    if r.status_code != 200:
        raise RuntimeError(f"Mission API error: status={r.status_code}, body={r.text}")

    return r.json()


def save_mission_completion(
    *,
    user_id: str,
    date_str: Union[str, date, datetime],
    completed_mission_ids: List[Union[str, int]],
    completed_at: Optional[str] = None,
) -> Dict[str, Any]:
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


def _check_api_key(x_api_key: Optional[str]):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")


class RecommendRequest(BaseModel):
    user_id: str
    k: int = 3
    exclude_days: int = 7


class CompleteRequest(BaseModel):
    user_id: str
    date_str: str
    completed_mission_ids: List[Union[str, int]]
    completed_at: Optional[str] = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/missions/recommend")
def missions_recommend(req: RecommendRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    return call_mission_api(user_id=req.user_id, k=req.k, exclude_days=req.exclude_days)


@app.post("/missions/complete")
def missions_complete(req: CompleteRequest, x_api_key: str = Header(None)):
    _check_api_key(x_api_key)
    return save_mission_completion(
        user_id=req.user_id,
        date_str=req.date_str,
        completed_mission_ids=req.completed_mission_ids,
        completed_at=req.completed_at,
    )
