# supabase_client.py

from supabase import create_client
from dotenv import load_dotenv
import os
import pandas as pd
import requests
import numpy as np
import json

load_dotenv()

# =========================
# Supabase 연결
# =========================
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
sb = create_client(url, key)

# =========================
# 사용자 선택 클럽 저장
# =========================

def save_user_club(user_id, club_domain):
    sb.table("user_selected_club").upsert({
        "user_id": user_id,
        "club_domain": club_domain,
        "status": "ACTIVE"
    }).execute()

# =========================
# 사용자 선택 클럽 삭제 (탈퇴)
# =========================

def leave_user_club(user_id):
    sb.table("user_selected_club").update({
        "status": "LEFT"
    }).eq("user_id", user_id).execute()

# =========================
# Predict API 설정
# =========================
PREDICT_API_URL = os.getenv("PREDICT_API_URL")
PREDICT_API_KEY = os.getenv("PREDICT_API_KEY")

def _predict_headers():
    return {
        "Content-Type": "application/json",
        "x-api-key": PREDICT_API_KEY
    }

# -------------------------------
# user_feature 조회
# -------------------------------
def fetch_user_feature(user_id):
    resp = sb.table("user_feature_30d") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    if not resp.data:
        raise ValueError("user_feature not found")

    return resp.data[0]

# -------------------------------
# benefit_labeled 조회
# -------------------------------
def fetch_benefits():
    resp = sb.table("benefit_labeled") \
        .select("*") \
        .execute()

    if not resp.data:
        return pd.DataFrame()

    return pd.DataFrame(resp.data)

def call_predict_api(*, user_id: str, segment_id: str, uuid_id: str):

    feature = fetch_user_feature(user_id)

    clean_feature = {
        k: (None if isinstance(v, float) and np.isnan(v) else v)
        for k, v in feature.items()
    }

    clean_feature["user_id"] = user_id
    clean_feature["segment_id"] = segment_id

    # ✅ benefits 항상 가져오기
    benefit_df = fetch_benefits().replace({np.nan: None})
    print("benefit row count:", len(benefit_df))

    payload = {
        "paths": ["dummy"],
        "config": {
            "input_data": clean_feature,
            "uuid_id": uuid_id,
            "benefits": benefit_df.to_dict(orient="records")
        }
    }

    print(json.dumps(payload, indent=2, ensure_ascii=False))

    r = requests.post(
        PREDICT_API_URL,
        json=payload,
        headers=_predict_headers(),
        timeout=60
    )

    print("\n===== 서버 응답 =====")
    print("Status Code:", r.status_code)
    print("Response Text:", r.text)

    if r.status_code != 200:
        return None

    return r.json()



# -------------------------------
# 실행 테스트
# -------------------------------
if __name__ == "__main__":
    print("=== Predict API 연결 테스트 ===")
    
    result = call_predict_api(
        user_id="U000001",
        segment_id="F_10대",
        uuid_id="debug-test"
    )

    print("\n=== 추천 결과 요약 ===")

    if not result or "data" not in result:
        print("❌ 예측 실패")
    else:
        data = result["data"]

        print(f"\n[Cluster] {data['cluster']}")
        print(f"[Club Domains] {data['club_domains']}")

        print("\n=== 클럽별 상세 혜택 ===")

        for idx, club in enumerate(data["clubs"], start=1):
            print(f"\n--- {idx}번 클럽: {club['domain']} ---")

            for offer_idx, offer in enumerate(club["offers"], start=1):
                print(f"\n  ({offer_idx}) {offer['brand']}")
                print(f"      제목: {offer['title']}")
                print(f"      타입: {offer['type']}")
                print(f"      채널: {offer['channel']}")
                print(f"      브랜드코드: {offer.get('brand_code')}")
                print(f"      URL: {offer['url']}")