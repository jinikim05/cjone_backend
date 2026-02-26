import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Home, ChevronRight, SlidersHorizontal } from "lucide-react";
import {
  totalEarnedPoints,
  transactionHistory,
  totalEarnSum,
  totalUseSum,
} from "@/data/userData";

const POINT_TABS = ["적립/사용", "충전/인출", "보너스", "선물", "소멸예정"];

export default function PointPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const pointStr = totalEarnedPoints.toLocaleString() + "P";

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
        <h1 className="text-[17px] font-bold text-foreground flex-1 text-center mr-10">나의 포인트</h1>
      </div>

      {/* Point Summary Card */}
      <div className="bg-card px-5 pt-5 pb-4 mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] text-muted-foreground">ONE 포인트</span>
            <span className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center text-[9px] text-muted-foreground">?</span>
          </div>
          <span className="text-[28px] font-bold text-primary">{pointStr}</span>
        </div>

        {/* Sub points row */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden mb-4">
          <div className="flex-1 px-3 py-2.5 border-r border-border">
            <p className="text-[11px] text-muted-foreground mb-1">사용가능</p>
            <p className="text-[15px] font-bold text-foreground">{pointStr}</p>
          </div>
          <div className="flex-1 px-3 py-2.5 border-r border-border">
            <p className="text-[11px] text-muted-foreground mb-1">가용예정</p>
            <p className="text-[15px] font-bold text-foreground">0P</p>
          </div>
          <div className="flex-1 px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground mb-1">당월소멸예정</p>
            <button className="text-[12px] font-semibold text-foreground border border-border rounded-full px-2 py-0.5">
              조회하기
            </button>
          </div>
        </div>

        {/* CJ PAY buttons */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 border border-border rounded-xl text-[14px] font-semibold text-foreground hover:bg-secondary transition-colors">
            CJ PAY 충전
          </button>
          <button className="flex-1 py-3 border border-border rounded-xl text-[14px] font-semibold text-foreground hover:bg-secondary transition-colors">
            CJ PAY 인출
          </button>
        </div>
      </div>

      {/* 추가 포인트 섹션 */}
      <div className="bg-card px-5 py-4 mb-2">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[14px] text-foreground">추가 포인트 받으러 가기</span>
          <span className="w-4 h-4 rounded-full border border-muted-foreground flex items-center justify-center text-[9px] text-muted-foreground">?</span>
        </div>
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <span className="text-[15px] font-black italic" style={{ color: "hsl(258, 65%, 45%)" }}>CJONSTYLE</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-[13px]">ONE 포인트 확인</span>
              <ChevronRight size={14} />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-[15px] font-black" style={{ color: "hsl(158, 60%, 35%)" }}>CJ THE MARKET</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-[13px]">ONE 포인트 확인</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 거래 내역 */}
      <div className="bg-card">
        <div className="flex border-b border-border overflow-x-auto">
          {POINT_TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-4 py-3 text-[13px] font-medium transition-colors border-b-2 ${
                activeTab === i
                  ? "border-foreground text-foreground font-bold"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-[13px] text-muted-foreground">
            총 <span className="text-primary font-bold">{transactionHistory.length}</span>건
          </p>
          <button className="text-muted-foreground">
            <SlidersHorizontal size={16} />
          </button>
        </div>

        <div className="flex items-center justify-around px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground">P+</span>
            </div>
            <span className="text-[14px] text-muted-foreground">적립 {totalEarnSum.toLocaleString()} P</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground">P</span>
            </div>
            <span className="text-[14px] text-muted-foreground">사용 {totalUseSum.toLocaleString()} P</span>
          </div>
        </div>

        <div>
          {transactionHistory.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-b-0">
              <div>
                <p className="text-[12px] text-muted-foreground mb-0.5">{item.date}</p>
                <p className="text-[14px] text-foreground">{item.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[16px] font-bold ${item.type === "earn" ? "text-foreground" : "text-primary"}`}>
                  {item.amount}
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
