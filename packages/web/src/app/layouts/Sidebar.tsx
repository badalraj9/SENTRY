import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../shared/lib/utils";
import { Kbd } from "../../shared/ui";
import { useAppSelector } from "../../store/hooks";
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  GitPullRequest,
  FileText,
  MonitorPlay,
  Settings,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Sidebar Component
   Terminal-style collapsible navigation matching login page aesthetic
   ═══════════════════════════════════════════════════════════════════════════ */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onCommandPaletteOpen: () => void;
}

// Lucide icons mapping
const navIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Messages: MessageSquare,
  Projects: FolderKanban,
  Decisions: GitPullRequest,
  Documents: FileText,
  Workshops: MonitorPlay,
  Settings: Settings,
};

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Messages", href: "/messages" },
  { name: "Projects", href: "/projects" },
  { name: "Decisions", href: "/decisions" },
  { name: "Documents", href: "/documents" },
  { name: "Workshops", href: "/workshops" },
];

const bottomNavigation = [{ name: "Settings", href: "/settings" }];

// Color mapping for nav items (semantic colors)
const navColors: Record<string, { icon: string; border: string; bg: string }> =
  {
    Dashboard: {
      icon: "text-success",
      border: "border-success",
      bg: "bg-success/10",
    },
    Messages: { icon: "text-info", border: "border-info", bg: "bg-info/10" },
    Projects: {
      icon: "text-success",
      border: "border-success",
      bg: "bg-success/10",
    },
    Decisions: { icon: "text-info", border: "border-info", bg: "bg-info/10" },
    Documents: {
      icon: "text-purple-400",
      border: "border-purple-400",
      bg: "bg-purple-400/10",
    },
    Workshops: {
      icon: "text-warning",
      border: "border-warning",
      bg: "bg-warning/10",
    },
    Settings: {
      icon: "text-terminal-400",
      border: "border-terminal-400",
      bg: "bg-terminal-800",
    },
  };

export function Sidebar({
  collapsed,
  onToggle,
  onCommandPaletteOpen,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <aside
      className={cn(
        "h-full flex flex-col",
        "glass-sidebar",
        "transition-all duration-200 font-sans text-sm",
      )}
    >
      {/* Logo / Brand - Minimal like login page with glow */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-terminal-800/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning text-glow-warning" />
            <span className="font-bold text-terminal-100 tracking-wide text-lg">
              SENTRY
            </span>
          </div>
        )}
        {collapsed && (
          <Zap className="w-5 h-5 text-warning text-glow-warning mx-auto" />
        )}
      </div>

      {/* Command Palette Trigger - Terminal style input with focus glow */}
      <div className="p-3">
        <button
          onClick={onCommandPaletteOpen}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg",
            "text-terminal-500 hover:text-terminal-300",
            "border border-terminal-700/50 bg-terminal-900/30",
            "transition-all duration-150",
            "hover:border-terminal-600 hover:bg-terminal-800/30",
            "focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent",
            collapsed && "justify-center px-2",
          )}
        >
          <Search className="w-4 h-4" />
          {!collapsed && (
            <>
              <span className="text-xs flex-1 text-left text-terminal-500">
                Search...
              </span>
              <Kbd>⌘K</Kbd>
            </>
          )}
        </button>
      </div>

      {/* Main Navigation - Clean terminal style with enhanced states */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            const colors = navColors[item.name];
            const IconComponent = navIcons[item.name];

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sm transition-all duration-150",
                    isActive
                      ? cn(
                          colors.icon,
                          "bg-gradient-to-r from-terminal-800/80 to-transparent",
                          colors.bg,
                          "border-l-2",
                          colors.border,
                        )
                      : "text-terminal-400 hover:text-terminal-200 hover:bg-terminal-800/30 border-l-2 border-transparent",
                    collapsed && "justify-center px-2",
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <IconComponent
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? colors.icon : "text-terminal-500",
                    )}
                  />
                  {!collapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-3 border-t border-terminal-800/50">
        {/* User Profile Snippet - With avatar circle */}
        {!collapsed && (
          <div className="mb-3 px-3 py-3 border border-terminal-700/50 bg-terminal-900/30 rounded-lg">
            <div className="flex items-center gap-3">
              {/* Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-info flex items-center justify-center text-terminal-950 text-sm font-bold shrink-0">
                {user?.handle?.[0]?.toUpperCase() ||
                  user?.displayName?.[0]?.toUpperCase() ||
                  "O"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-terminal-100 truncate font-medium">
                  {user?.handle || "operator"}
                </p>
                <p className="text-xs text-terminal-500 truncate">
                  L5 clearance
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && (
          <div className="mb-3 flex justify-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-info flex items-center justify-center text-terminal-950 text-sm font-bold">
              {user?.handle?.[0]?.toUpperCase() ||
                user?.displayName?.[0]?.toUpperCase() ||
                "O"}
            </div>
          </div>
        )}

        <ul className="space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            const colors = navColors[item.name];
            const IconComponent = navIcons[item.name];

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sm transition-all duration-150",
                    isActive
                      ? cn(
                          colors.icon,
                          "bg-gradient-to-r from-terminal-800/80 to-transparent",
                          colors.bg,
                          "border-l-2",
                          colors.border,
                        )
                      : "text-terminal-400 hover:text-terminal-200 hover:bg-terminal-800/30 border-l-2 border-transparent",
                    collapsed && "justify-center px-2",
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <IconComponent
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? colors.icon : "text-terminal-500",
                    )}
                  />
                  {!collapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg",
            "text-sm transition-colors duration-150",
            "text-terminal-500 hover:text-terminal-300 hover:bg-terminal-800/30",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
