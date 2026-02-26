import { Search, ChevronLeft } from "lucide-react";

interface AppHeaderProps {
  title: string;
}

export default function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="bg-card flex items-center justify-between px-4 py-3 border-b border-border">
      <button className="p-1 text-foreground">
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <button className="p-1 text-foreground">
        <Search size={20} />
      </button>
    </header>
  );
}
