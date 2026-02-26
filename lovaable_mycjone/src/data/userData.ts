import transactionsCsv from "./sample.csv?raw";
import domainCsv from "./domain_master_forcoupon.csv?raw";

/* ── CSV parser ── */
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^\uFEFF/, ""));
  return lines.slice(1).filter(Boolean).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
    return obj;
  });
}

/* ── raw data (already filtered for U000435) ── */
const allTx = parseCsv(transactionsCsv);
const domainRows = parseCsv(domainCsv);

/* ── 이번달(2026년 1월) 거래만 필터 (소비분석용) ── */
const userTx = allTx; // 전체 (포인트/브랜드 계산용)
const janTx = allTx.filter((r) => {
  const d = parseInt(r["거래일자"], 10) || 0;
  return d >= 20260101 && d <= 20260131;
});

// brand_code → domain map
const brandToDomain: Record<string, string> = {};
domainRows.forEach((r) => {
  const code = r["brand_code"]?.trim();
  const domain = r["domain"]?.trim();
  if (code) brandToDomain[code] = domain || "Unknown";
});

/* ── exports ── */

/** 적립포인트 합계 (ProfileCard & PointPage 공유) */
export const totalEarnedPoints = userTx.reduce(
  (s, r) => s + (parseInt(r["적립포인트"], 10) || 0),
  0
);

/** 구매금액 합계 - 이번달(1월) only (SpendingDonut 중앙) */
export const totalSpend = janTx.reduce(
  (s, r) => s + (parseInt(r["구매금액"], 10) || 0),
  0
);

/** 고유 브랜드 수 */
export const uniqueBrandCount = new Set(userTx.map((r) => r["브랜드"])).size;

/* ── 도메인별 구매금액 집계 ── */
const DOMAIN_COLORS: Record<string, string> = {
  Beauty: "#F16BC8",
  Food: "#FF7A5C",
  Entertainment: "#30C08D",
  Commerce: "#5E6EFF",
  General: "hsl(220, 10%, 65%)",
  Unknown: "hsl(0, 0%, 75%)",
};

const domainAgg: Record<string, number> = {};
janTx.forEach((r) => {
  const amt = parseInt(r["구매금액"], 10) || 0;
  if (amt <= 0) return;
  const domain = brandToDomain[r["브랜드"]] || "Unknown";
  domainAgg[domain] = (domainAgg[domain] || 0) + amt;
});

export const domainSpendData = Object.entries(domainAgg)
  .filter(([, v]) => v > 0)
  .sort((a, b) => b[1] - a[1])
  .map(([name, value]) => ({
    name,
    value,
    color: DOMAIN_COLORS[name] || DOMAIN_COLORS.Unknown,
  }));

/* ── 거래 내역 (PointPage 히스토리) ── */
export interface TxHistory {
  date: string;
  title: string;
  amount: string;
  type: "earn" | "use";
}

export const transactionHistory: TxHistory[] = userTx
  .map((r) => {
    const d = r["거래일자"];
    const date = d
      ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`
      : "";
    const earned = parseInt(r["적립포인트"], 10) || 0;
    const used = parseInt(r["사용포인트"], 10) || 0;
    if (earned > 0) {
      return { date, title: r["브랜드명"] || "CJ ONE", amount: `+${earned}P`, type: "earn" as const };
    }
    if (used > 0) {
      return { date, title: r["브랜드명"] || "CJ ONE", amount: `-${used}P`, type: "use" as const };
    }
    return null;
  })
  .filter((x): x is TxHistory => x !== null)
  .sort((a, b) => b.date.localeCompare(a.date));

/** 적립 합계 & 사용 합계 */
export const totalEarnSum = userTx.reduce(
  (s, r) => s + (parseInt(r["적립포인트"], 10) || 0),
  0
);
export const totalUseSum = userTx.reduce(
  (s, r) => s + (parseInt(r["사용포인트"], 10) || 0),
  0
);
