import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { domainSpendData, totalSpend } from "@/data/userData";

export default function SpendingDonut() {
  const navigate = useNavigate();

  return (
    <div
      className="bg-card rounded-2xl p-5 mx-4 mb-3 shadow-sm cursor-pointer active:opacity-80 transition-opacity"
      onClick={() => navigate("/point")}
    >
      <h2 className="text-base font-bold text-foreground mb-4">이번달 소비분석</h2>
      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={domainSpendData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {domainSpendData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center pointer-events-none">
            <p className="text-[11px] text-muted-foreground leading-none mb-1">총 지출</p>
            <p className="text-[19px] font-bold text-foreground leading-tight">
              {totalSpend.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">KRW</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1">
          {domainSpendData.map((item) => (
            <div key={item.name}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-[11px] text-muted-foreground">{item.name}</span>
              </div>
              <p className="text-[15px] font-bold text-foreground pl-3.5">
                {item.value.toLocaleString()}원
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
