// src/lib/api.js

const CLUB_API_BASE = import.meta.env.VITE_CLUB_API_BASE ?? "http://localhost:8000";
const MISSION_API_BASE = import.meta.env.VITE_MISSION_API_BASE ?? "http://localhost:8001";
const BENEFIT_API_BASE = import.meta.env.VITE_BENEFIT_API_BASE ?? CLUB_API_BASE;
const API_KEY = import.meta.env.VITE_API_KEY ?? "cHnhXyxjy3iAjuRVy4Nl7XIzulU0eP0L1JnAPTk341U";

async function post(base, path, body) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${url} failed (${res.status}): ${text}`);
  }

  return res.json();
}

/* =========================
   Mission APIs
========================= */

export async function fetchMissions({ userId, k = 3, excludeDays = 7 }) {
  return post(MISSION_API_BASE, "/missions/recommend", {
    user_id: userId,
    k,
    exclude_days: excludeDays,
  });
}

export async function completeMission({ userId, missionId, dateStr, completedAt }) {
  const now = new Date();
  const defaultDateStr = now.toISOString().slice(0, 10);
  const defaultCompletedAt = now.toISOString().replace("T", " ").slice(0, 19);

  return post(MISSION_API_BASE, "/missions/complete", {
    user_id: userId,
    date_str: dateStr ?? defaultDateStr,
    completed_mission_ids: [missionId],
    completed_at: completedAt ?? defaultCompletedAt,
  });
}

/* =========================
   Club APIs
========================= */

export async function predictClubs(userId) {
  return post(CLUB_API_BASE, "/predict", {
    user_id: userId,
  });
}

export async function selectClub(userId, clubDomain) {
  return post(CLUB_API_BASE, "/select_club", {
    user_id: userId,
    club_domain: clubDomain,
  });
}

export async function leaveClub(userId) {
  return post(CLUB_API_BASE, "/leave_club", {
    user_id: userId,
  });
}

/* =========================
   Benefit APIs
========================= */

export async function fetchBenefits({ userId, k = 3 }) {
  return post(BENEFIT_API_BASE, "/benefits/recommend", {
    user_id: userId,
    k,
  });
}

export async function redeemBenefit({ userId, benefitId }) {
  return post(BENEFIT_API_BASE, "/benefits/redeem", {
    user_id: userId,
    benefit_id: benefitId,
  });
}
