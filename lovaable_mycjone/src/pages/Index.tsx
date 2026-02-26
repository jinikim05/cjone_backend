import { useRef, useState, useCallback } from "react";
import AppHeader from "@/components/AppHeader";
import TabBar from "@/components/TabBar";
import ProfileCard from "@/components/ProfileCard";
import SpendingDonut from "@/components/SpendingDonut";
import ClubSection from "@/components/ClubSection";
import MissionSection from "@/components/MissionSection";
import BottomNav from "@/components/BottomNav";

const TABS = ["나의 소비현황", "나의 클럽", "나의 미션"];

const Index = () => {
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const spendingRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);

  const isScrollingRef = useRef(false);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    const refs = [spendingRef, clubRef, missionRef];
    const target = refs[index].current;
    const container = scrollRef.current;
    if (!target || !container) return;

    isScrollingRef.current = true;

    let scrollTo: number;
    if (index === 0) {
      // 소비현황: 맨 위로
      scrollTo = 0;
    } else if (index === 2) {
      // 미션: 맨 아래로
      scrollTo = container.scrollHeight;
    } else {
      // 클럽: 섹션 상단이 화면 중앙에 오도록
      const containerHeight = container.clientHeight;
      const targetTop = target.offsetTop;
      const targetHeight = target.offsetHeight;
      scrollTo = targetTop - (containerHeight - targetHeight) / 2;
    }
    container.scrollTo({ top: Math.max(0, scrollTo), behavior: "smooth" });

    // 스크롤 애니메이션 완료 후 다시 스크롤 감지 활성화
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  };

  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;

    const container = scrollRef.current;
    const refs = [spendingRef, clubRef, missionRef];
    if (!container) return;

    const scrollTop = container.scrollTop + 80; // 상단 약간의 오프셋
    let active = 0;

    refs.forEach((ref, i) => {
      if (ref.current && ref.current.offsetTop <= scrollTop) {
        active = i;
      }
    });

    setActiveTab(active);
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <AppHeader title="나의 CJone" />

      {/* Tab Bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="overflow-y-auto pt-4 pb-4"
        style={{ height: "calc(100dvh - 112px)" }}
        onScroll={handleScroll}
      >
        <ProfileCard />
        <div ref={spendingRef}>
          <SpendingDonut />
        </div>
        <div ref={clubRef}>
          <ClubSection />
        </div>
        <div ref={missionRef}>
          <MissionSection />
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default Index;
