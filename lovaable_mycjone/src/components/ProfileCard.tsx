import { useState, useRef, useEffect } from "react";
import { totalEarnedPoints, uniqueBrandCount } from "@/data/userData";

// brand_count 기준 (cjone_bonuspoint.csv): 3개 → 원픽 라이프, 4개 → 멀티 라이프, 5개 이상 → 올라운드 라이프
function getBonusInfo(brandCount: number) {
  if (brandCount >= 5) {
    return { nickname: "올라운드 라이프", information: "cj브랜드 5개 이용시,100%추가 적립!" };
  } else if (brandCount >= 4) {
    return {
      nickname: "멀티 라이프",
      information: "cj브랜드 4개 이용시,50%추가 적립!",
      level: "브랜드 1개 더 이용시 올라운드 라이프!",
    };
  } else {
    return {
      nickname: "원픽 라이프",
      information: "제휴 브랜드 확인하고,추가 5%적립 받기!",
      level: "브랜드 1개 더 이용시 멀티 라이프!",
    };
  }
}

export default function ProfileCard() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    setUpdatedAt(`${y}.${m}.${d} ${h}:${min}`);
  }, []);

  const { nickname, information, level } = getBonusInfo(uniqueBrandCount);

  return (
    <div className="bg-card rounded-2xl p-5 mx-4 mb-3 shadow-sm">
      {/* Top Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={`https://wkkbmehiznsmeemplxpe.supabase.co/storage/v1/object/public/image/onestar_profile.png`}
              alt="프로필 이미지"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                target.parentElement!.classList.add("bg-foreground");
              }}
            />
          </div>
          <div>
            <p className="text-[17px] font-bold text-foreground leading-tight">원스터님</p>
            <p className="text-[12px] text-muted-foreground">{nickname}</p>
          </div>
        </div>

        {/* Points */}
        <div className="text-right relative">
          <p className="text-[22px] font-bold text-point leading-tight">
            {totalEarnedPoints.toLocaleString()} <span className="text-[16px]">P</span>
          </p>
          <button
            ref={buttonRef}
            onClick={() => setPopoverOpen((v) => !v)}
            className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hover:bg-secondary/80 transition-colors"
          >
            {uniqueBrandCount}개 브랜드 이용중
          </button>

          {/* Popover */}
          {popoverOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-[260px] bg-card border border-border rounded-xl shadow-lg p-4">
              <div className="space-y-3">
                <p className="text-[12px] font-semibold text-foreground">{nickname}</p>
                {information ? (
                  <>
                    <p className="text-[12px] text-foreground leading-relaxed">{information}</p>
                    {level ? <p className="text-[11px] text-muted-foreground leading-relaxed">{level}</p> : null}
                  </>
                ) : (
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    더 많은 CJ 브랜드를 이용하면 추가 혜택을 받을 수 있어요!
                  </p>
                )}
                <a
                  href="https://www.cjone.com/cjmweb/point-card/bonus-point.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[12px] font-semibold text-primary hover:underline"
                >
                  cj제휴 브랜드 보러가기 →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-3" />

      {/* Bottom Row */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">Updated: {updatedAt}</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-point" />
          <span className="text-[12px] text-muted-foreground">일반 등급</span>
        </div>
      </div>
    </div>
  );
}
