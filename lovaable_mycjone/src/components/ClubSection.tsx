import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { predictClubs, selectClub, leaveClub } from "@/lib/api";

type Offer = {
  brand: string;
  title: string;
  type: string;
  channel: string;
  url: string;
};

type Club = {
  domain: string;
  offers: Offer[];
};

type ClubState = "initial" | "loading" | "revealed" | "benefits";

const MIN_LOADING_MS = 3000;

export default function ClubSection() {
  const [state, setState] = useState<ClubState>("initial");
  const [menuOpen, setMenuOpen] = useState(false);
  const [recommended, setRecommended] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [initialImageError, setInitialImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userId = "U000409";

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ 추천 요청: API가 빨리 성공해도 최소 3초 로딩 연출 후 revealed
  const handleAnalyze = async () => {
    if (state !== "initial") return;

    setState("loading");

    const startedAt = Date.now();

    try {
      const data = await predictClubs(userId);

      if (!data?.data?.clubs) {
        throw new Error("추천 데이터 없음");
      }

      // 최소 로딩 시간(3초) 맞추기
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, MIN_LOADING_MS - elapsed);
      if (remain > 0) {
        await new Promise((resolve) => setTimeout(resolve, remain));
      }

      setRecommended(data.data.clubs);
      setState("revealed");
    } catch (err) {
      console.error("Predict Error:", err);

      // 실패도 최소 3초는 로딩 보여주고 initial로 복귀(원하면 바로 복귀로 바꿔도 됨)
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, MIN_LOADING_MS - elapsed);
      if (remain > 0) {
        await new Promise((resolve) => setTimeout(resolve, remain));
      }

      setState("initial");
    }
  };

  // ✅ 클럽 선택
  const handleClubClick = async (club: Club) => {
    try {
      await selectClub(userId, club.domain);
      setSelectedClub(club);
      setState("benefits");
    } catch (err) {
      console.error("Select Club Error:", err);
    }
  };

  // ✅ 클럽 탈퇴
  const handleLeave = async () => {
    try {
      await leaveClub(userId);

      setSelectedClub(null);
      setRecommended([]);
      setState("initial");
      setMenuOpen(false);
    } catch (err) {
      console.error("Leave Club Error:", err);
    }
  };

  return (
    <div className="mx-4 mb-3">
      <div className="flex items-center gap-1.5 mb-3">
        <h2 className="text-base font-bold">나의 Club</h2>
      </div>

      <div
        className="rounded-2xl relative overflow-hidden"
        style={{
          background:
            state === "initial"
              ? "transparent"
              : "linear-gradient(135deg, hsl(258, 65%, 50%), hsl(280, 70%, 60%))",
          minHeight: state === "initial" ? undefined : "260px",
          padding: state === "initial" ? 0 : "1.25rem",
        }}
      >
        {/* 메뉴 버튼 */}
        {state !== "initial" && (
          <div className="absolute top-3 right-3 z-10" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              <MoreVertical size={16} className="text-white" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-10 min-w-[120px]">
                <button
                  onClick={handleLeave}
                  className="w-full px-4 py-2.5 text-[13px] text-left text-red-500 hover:bg-red-50"
                >
                  클럽 탈퇴하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 초기 상태 */}
        {state === "initial" && (
          <button onClick={handleAnalyze} className="w-full block">
            {initialImageError ? (
              <div className="w-full h-[180px] bg-gray-200 rounded-2xl flex items-center justify-center">
                <span>소비패턴 분석받기</span>
              </div>
            ) : (
              <img
                src="/club-initial-final.png"
                alt="소비패턴 분석받기"
                className="w-full h-[180px] object-cover rounded-2xl"
                onError={() => setInitialImageError(true)}
              />
            )}
          </button>
        )}

        {/* 로딩 */}
        {state === "loading" && (
          <div className="w-full flex items-center justify-center" style={{ minHeight: "200px" }}>
            <p className="text-white">혜택 추천중...</p>
          </div>
        )}

        {/* 추천 클럽 */}
        {state === "revealed" && (
          <>
            <p className="text-center text-white mb-4">아래 3개의 클럽을 추천드립니다.</p>
            <div className="flex gap-2">
              {recommended?.map((club, idx) => (
                <button
                  key={idx}
                  onClick={() => handleClubClick(club)}
                  className="flex-1 border border-white/60 rounded-2xl bg-white/10 hover:bg-white/20 p-4"
                >
                  <p className="text-white font-bold text-sm">{club.domain} Club</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 혜택 */}
        {state === "benefits" && selectedClub !== null && (
          <>
            <p className="text-center text-white font-bold mb-4">{selectedClub.domain} Club</p>

            <div className="flex flex-col gap-3">
              {selectedClub.offers?.map((offer, idx) => (
                <div key={idx} className="border border-white/40 rounded-xl p-3 bg-white/10">
                  <p className="text-white font-semibold text-sm">{offer.brand}</p>
                  <p className="text-white/80 text-xs mt-1">{offer.title}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
