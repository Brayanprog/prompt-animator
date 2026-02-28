import { Plus, FolderOpen, MessageSquare, Layers, Image, Code, LayoutGrid } from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "new", icon: Plus, label: "New" },
  { id: "projects", icon: FolderOpen, label: "Projects" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "timeline", icon: Layers, label: "Timeline" },
  { id: "media", icon: Image, label: "Media" },
  { id: "code", icon: Code, label: "Code" },
  { id: "templates", icon: LayoutGrid, label: "Templates" },
];

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <div className="w-16 bg-sidebar flex flex-col items-center py-4 border-r border-sidebar-border shrink-0">
      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto">
        <SettingsDialog />
      </div>
    </div>
  );
}
