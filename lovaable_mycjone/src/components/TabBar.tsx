interface TabBarProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="bg-card flex border-b border-border">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => onTabChange(index)}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === index
              ? "text-tab-active"
              : "text-muted-foreground"
          }`}
        >
          {tab}
          {activeTab === index && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-tab-active rounded-t-sm" />
          )}
        </button>
      ))}
    </div>
  );
}
