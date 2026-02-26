import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";

const MISSION_TABS = ["HOME", "미션적립", "체험적립", "참여적립"];

const missionList = [
  {
    title: "세이브캐시\n잔고 확인하고 쿠폰 받기",
    period: "2026.02.15 ~ 02.28",
    point: "1P",
    bgColor: "hsl(280, 60%, 55%)",
    emoji: "🎫",
  },
  {
    title: "5G 120GB 월1.5만\nKT 요고49",
    period: "2026.02.12 ~ 12.31",
    point: "1P",
    bgColor: "hsl(35, 90%, 50%)",
    emoji: "👑",
  },
  {
    title: "프리즘 신한카드\n최대 100,000P 증정",
    period: "2026.02.03 ~ 02.28",
    point: "1P",
    bgColor: "hsl(310, 60%, 75%)",
    emoji: "💳",
  },
  {
    title: "매일 오전 7시\n특가를 확인해보세요!",
    period: "2026.01.01 ~ 12.31",
    point: "5P",
    bgColor: "hsl(45, 90%, 55%)",
    emoji: "🎁",
  },
  {
    title: "카페 5회 이용하고\n포인트 적립받기",
    period: "2026.02.01 ~ 02.28",
    point: "200P",
    bgColor: "hsl(326, 85%, 50%)",
    emoji: "☕",
  },
  {
    title: "만보 걷기 달성하고\n건강 포인트 받기",
    period: "2026.02.01 ~ 02.28",
    point: "50P",
    bgColor: "hsl(158, 60%, 45%)",
    emoji: "🚶",
  },
];

export default function MissionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="app-container bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="mr-3 text-foreground">
          <ChevronLeft size={24} />
        </button>
        <button className="mr-3 text-foreground">
          <Home size={20} />
        </button>
        <div className="flex-1" />
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="flex">
          {MISSION_TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-[13px] font-medium transition-colors border-b-2 ${
                activeTab === i
                  ? "border-foreground text-foreground font-bold"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto" style={{ height: "calc(100dvh - 104px)" }}>
        {/* Hero section */}
        <div className="px-5 pt-6 pb-4 bg-card mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">
              우리가 ONE하는<br />모든 포인트 혜택
            </h2>
            <p className="text-[13px] text-muted-foreground">
              참여할수록 더 많은 P<span className="text-primary">🙂</span>int!
            </p>
          </div>
          <div className="text-5xl">🤖</div>
        </div>

        {/* Banner */}
        <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ background: "hsl(258, 50%, 22%)" }}>
          <div className="p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/60 text-[11px] italic font-bold">INFOVINE</span>
              </div>
              <h3 className="text-white text-[18px] font-bold leading-tight mb-1">
                올리브영 상품권<br />뽑기 &gt;
              </h3>
              <p className="text-white/70 text-[12px]">1,000원~30,000원 랜덤 지급</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white rounded-full px-2 py-1 flex items-center gap-1">
                <span className="text-primary font-bold text-[11px]">P</span>
                <span className="text-foreground font-bold text-[11px]">1P</span>
              </div>
              <div className="text-4xl">🎱</div>
            </div>
          </div>
        </div>

        {/* Pagination indicator */}
        <div className="flex justify-end px-4 mb-4">
          <div className="flex items-center gap-1.5 bg-secondary rounded-full px-2.5 py-1">
            <span className="text-[12px] text-muted-foreground">3 / 10</span>
            <div className="w-3 h-3 rounded-full border border-muted-foreground flex items-center justify-center">
              <span className="text-[6px]">II</span>
            </div>
          </div>
        </div>

        {/* Mission list */}
        <div className="bg-card">
          {missionList.map((mission, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-secondary/30 transition-colors"
            >
              <div className="flex-1 pr-4">
                <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-1">
                  {mission.title.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j === 0 && <br />}
                    </span>
                  ))}
                </h3>
                <p className="text-[12px] text-muted-foreground">{mission.period}</p>
              </div>
              <div className="relative w-16 h-16 flex-shrink-0">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: mission.bgColor }}
                >
                  {mission.emoji}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm border border-border">
                  <span className="text-primary font-bold text-[9px]">P</span>
                  <span className="text-foreground font-bold text-[9px]">{mission.point}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
