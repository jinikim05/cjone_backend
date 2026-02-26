import os
from typing import Dict, Optional

import numpy as np
import pandas as pd
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not set")
    return value


SUPABASE_URL = _required_env("SUPABASE_URL")
SUPABASE_SERVICE_KEY = _required_env("SUPABASE_SERVICE_KEY")
PREDICT_API_URL = _required_env("PREDICT_API_URL")
PREDICT_API_KEY = _required_env("PREDICT_API_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def save_user_club(user_id: str, club_domain: str):
    sb.table("user_selected_club").upsert(
        {"user_id": user_id, "club_domain": club_domain, "status": "ACTIVE"}
    ).execute()


def leave_user_club(user_id: str):
    sb.table("user_selected_club").update({"status": "LEFT"}).eq("user_id", user_id).execute()


def _predict_headers() -> Dict[str, str]:
    return {"Content-Type": "application/json", "x-api-key": PREDICT_API_KEY}


def fetch_user_feature(user_id: str) -> Dict:
    resp = sb.table("user_feature_30d").select("*").eq("user_id", user_id).execute()
    if not resp.data:
        raise ValueError(f"user_feature not found for user_id={user_id}")
    return resp.data[0]


def fetch_benefits() -> pd.DataFrame:
    resp = sb.table("benefit_labeled").select("*").execute()
    if not resp.data:
        return pd.DataFrame()
    return pd.DataFrame(resp.data)


def call_predict_api(*, user_id: str, segment_id: str, uuid_id: str) -> Optional[Dict]:
    feature = fetch_user_feature(user_id)
    clean_feature = {
        k: (None if isinstance(v, float) and np.isnan(v) else v)
        for k, v in feature.items()
    }
    clean_feature["user_id"] = user_id
    clean_feature["segment_id"] = segment_id

    benefit_df = fetch_benefits().replace({np.nan: None})
    payload = {
        "paths": ["dummy"],
        "config": {
            "input_data": clean_feature,
            "uuid_id": uuid_id,
            "benefits": benefit_df.to_dict(orient="records"),
        },
    }

    r = requests.post(
        PREDICT_API_URL,
        json=payload,
        headers=_predict_headers(),
        timeout=60,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Predict API error: status={r.status_code}, body={r.text}")
    return r.json()
