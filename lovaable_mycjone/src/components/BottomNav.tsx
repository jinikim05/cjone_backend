import { Home, BadgePercent, ScanLine, CreditCard, CircleUserRound } from "lucide-react";

const navItems = [
  { icon: Home, label: "홈", active: true },
  { icon: BadgePercent, label: "오늘미션", active: false },
  { icon: ScanLine, label: "적립·결제", active: false },
  { icon: CreditCard, label: "제휴카드", active: false },
  { icon: CircleUserRound, label: "마이", active: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border flex items-center z-50 pb-safe">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={`flex-1 flex flex-col items-center pt-3 pb-4 gap-1 transition-colors ${
            item.active ? "text-nav-active" : "text-muted-foreground"
          }`}
        >
          <item.icon
            size={26}
            strokeWidth={item.active ? 2 : 1.6}
            fill={item.active && item.label === "홈" ? "currentColor" : "none"}
          />
          <span className={`text-[11px] font-medium ${item.active ? "text-nav-active" : "text-muted-foreground"}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
