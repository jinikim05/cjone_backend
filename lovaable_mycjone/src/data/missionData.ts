import missionRawCsv from "./mission_raw.csv?raw";
import missionLabeledCsv from "./mission_labeled_stage1.csv?raw";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// RFC 4180 CSV parser that handles quoted fields with newlines/commas
function parseRfc4180Csv(raw: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  // Remove BOM
  const text = raw.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current.trim());
        current = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        if (ch === "\r") i++;
        row.push(current.trim());
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }
  // last field
  row.push(current.trim());
  if (row.length > 1 || row[0] !== "") rows.push(row);

  return rows;
}

function parseSimpleCsv(raw: string): Record<string, string>[] {
  const text = raw.replace(/^\uFEFF/, "");
  const lines = text.split("\n").filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] || ""));
    return obj;
  });
}

// Parse mission_raw.csv (RFC 4180 due to multi-line content)
const rawRows = parseRfc4180Csv(missionRawCsv);
const rawHeaders = rawRows[0]; // 기업명, 제휴여부, 미션유형, 미션제목, 적립포인트, 미션내용, 링크
const rawData = rawRows.slice(1);

// Parse mission_labeled_stage1.csv (simple CSV)
const labeledData = parseSimpleCsv(missionLabeledCsv);

// Column indices for mission_raw
const titleIdx = rawHeaders.findIndex((h) => h.includes("미션제목"));
const pointIdx = rawHeaders.findIndex((h) => h.includes("적립포인트") || h.includes("적립 포인트"));
const contentIdx = rawHeaders.findIndex((h) => h.includes("미션내용") || h.includes("미션 내용"));
const linkIdx = rawHeaders.findIndex((h) => h.includes("링크"));
const missionTypeIdx = rawHeaders.findIndex((h) => h.includes("미션유형"));

// Storage file names (some have .svg extension, some don't)
const iconFileMap: Record<string, string> = {
  Click: "Click.svg",
  PurchaseReward: "PurchaseReward.svg",
  SNS: "SNS",
  Participate: "Participate",
};

export interface MissionItem {
  id: number;
  title: string;
  point: number;
  content: string;
  link: string;
  actionType: string;
  missionType: string;
  iconUrl: string;
}

export const missions: MissionItem[] = rawData.map((row, i) => {
  const labeled = labeledData[i] || {};
  const actionType = labeled["mission_action_type"] || "Click";
  const fileName = iconFileMap[actionType] || `${actionType}.svg`;
  return {
    id: i + 1,
    title: row[titleIdx] || "",
    point: parseInt(row[pointIdx] || "0", 10),
    content: row[contentIdx] || "",
    link: row[linkIdx] || "",
    actionType,
    missionType: row[missionTypeIdx] || "",
    iconUrl: `${SUPABASE_URL}/storage/v1/object/public/mission-icon/${fileName}`,
  };
});
