import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { missions as fallbackMissions, type MissionItem } from "@/data/missionData";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchMissions, completeMission } from "@/lib/api";

function normalizeMissionsFromBackend(raw: any, fallback: MissionItem[]): MissionItem[] {
  const results = raw?.data?.results;
  if (!Array.isArray(results) || results.length === 0) {
    return fallback.slice(0, 3);
  }

  // Korean keys written as unicode escapes to avoid encoding corruption.
  const K_MISSION_TITLE = "\uBBF8\uC158\uC81C\uBAA9";
  const K_POINT = "\uC801\uB9BD\uD3EC\uC778\uD2B8";
  const K_LINK = "\uB9C1\uD06C";
  const K_COMPANY = "\uAE30\uC5C5\uBA85";

  return results.slice(0, 3).map((m: any, idx: number) => {
    const idRaw = m?.mission_id ?? m?.id ?? idx + 1;
    const id =
      typeof idRaw === "number"
        ? idRaw
        : typeof idRaw === "string"
          ? parseInt(idRaw, 10) || idx + 1
          : idx + 1;

    const title =
      m?.[K_MISSION_TITLE] ??
      m?.mission_title ??
      m?.title ??
      `${m?.[K_COMPANY] ?? m?.company ?? "\uBBF8\uC158"} \uBBF8\uC158`;

    const pointRaw = m?.[K_POINT] ?? m?.reward_point ?? m?.point ?? 0;
    const point = typeof pointRaw === "number" ? pointRaw : parseInt(String(pointRaw), 10) || 0;

    const link = m?.[K_LINK] ?? m?.link ?? m?.url ?? "";

    const brand = m?.[K_COMPANY] ?? m?.company ?? "";
    const domain = m?.mission_domain ?? "";
    const action = m?.mission_action_type ?? "";
    const partnerFlag = m?.partner_flag ?? "";

    const contentLines = [
      brand ? `\uBE0C\uB79C\uB4DC: ${brand}` : null,
      domain ? `\uB3C4\uBA54\uC778: ${domain}` : null,
      action ? `\uBBF8\uC158 \uD0C0\uC785: ${action}` : null,
      partnerFlag ? `\uC81C\uD734 \uC5EC\uBD80: ${partnerFlag === "Y" ? "\uC81C\uD734" : "\uBE44\uC81C\uD734"}` : null,
    ].filter(Boolean);

    const content = contentLines.join("\n");

    const missionType =
      fallback[idx]?.missionType ??
      (domain ? `${domain} \uBBF8\uC158` : "\uCD94\uCC9C \uBBF8\uC158");
    const actionType = fallback[idx]?.actionType ?? action ?? "mission";
    const iconUrl = fallback[idx]?.iconUrl ?? "";

    const item: MissionItem = {
      id,
      title,
      content,
      point,
      missionType,
      actionType,
      iconUrl,
      link,
    };

    return item;
  });
}

export default function MissionSection() {
  const navigate = useNavigate();

  const [selectedMission, setSelectedMission] = useState<MissionItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [doneMissions, setDoneMissions] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [missionsState, setMissionsState] = useState<MissionItem[]>(() => fallbackMissions.slice(0, 3));
  const [error, setError] = useState<string | null>(null);

  const userId = "U000001";

  const markDone = useCallback((missionId: number) => {
    setDoneMissions((prev) => new Set(prev).add(missionId));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const raw = await fetchMissions({ userId, k: 3, excludeDays: 7 });
        const normalized = normalizeMissionsFromBackend(raw, fallbackMissions);
        if (!mounted) return;
        setMissionsState(normalized);
      } catch (e: any) {
        if (!mounted) return;
        console.error("Fetch Missions Error:", e);
        setError(e?.message ?? String(e));
        setMissionsState(fallbackMissions.slice(0, 3));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleMissions = useMemo(() => missionsState.slice(0, 3), [missionsState]);

  const handleMissionClick = (mission: MissionItem) => {
    if (doneMissions.has(mission.id)) return;

    if (mission.content) {
      setSelectedMission(mission);
      setDrawerOpen(true);
    } else {
      markDone(mission.id);
      if (mission.link) {
        window.open(mission.link, "_blank", "noopener,noreferrer");
      }
      completeMission({ userId, missionId: mission.id }).catch((e) => console.error(e));
    }
  };

  const handleJoinMission = async () => {
    if (!selectedMission) {
      setDrawerOpen(false);
      return;
    }

    markDone(selectedMission.id);

    if (selectedMission.link) {
      window.open(selectedMission.link, "_blank", "noopener,noreferrer");
    }

    try {
      await completeMission({ userId, missionId: selectedMission.id });
    } catch (e) {
      console.error("completeMission Error:", e);
    }

    setDrawerOpen(false);
  };

  return (
    <div className="mx-4 mb-24">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">{"\uCD94\uCC9C \uBBF8\uC158"}</h2>
        <button
          onClick={() => navigate("/missions")}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground mb-2">
          {"\uBBF8\uC158 \uBD88\uB7EC\uC624\uB294 \uC911..."}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500 mb-2">
          {"\uBBF8\uC158 \uB85C\uB529 \uC2E4\uD328: "}
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {visibleMissions.map((mission) => (
          <div
            key={mission.id}
            onClick={() => handleMissionClick(mission)}
            className={`relative bg-card rounded-2xl p-3 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all overflow-hidden ${
              doneMissions.has(mission.id) ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src={mission.iconUrl}
                alt={mission.actionType}
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">{mission.missionType}</p>
              <p className="text-[12px] font-semibold text-foreground leading-tight truncate">
                {mission.title}
              </p>
            </div>
            <p className="text-[13px] font-bold text-mission-point flex-shrink-0">
              {doneMissions.has(mission.id) ? "\uC644\uB8CC" : `+${mission.point}P`}
            </p>
          </div>
        ))}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[50dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-lg">{selectedMission?.title}</DrawerTitle>
            <DrawerDescription className="text-mission-point font-bold">
              +{selectedMission?.point}P {"\uC801\uB9BD"}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 overflow-y-auto">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pb-4">
              {selectedMission?.content}
            </p>
          </ScrollArea>
          <DrawerFooter>
            <Button onClick={handleJoinMission} className="w-full rounded-xl">
              {"\uBBF8\uC158 \uCC38\uC5EC\uD558\uAE30"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

