import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "../../../store/hooks";
import {
  User,
  Mail,
  Shield,
  Calendar,
  MessageSquare,
  FileText,
  MonitorPlay,
  GitPullRequest,
  Key,
  Clock,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../../shared/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   User Profile Page
   Modern glassmorphic profile with stats
   ═══════════════════════════════════════════════════════════════════════════ */

export default function UserProfile() {
  const { user } = useAppSelector((state) => state.auth);

  const stats = [
    {
      label: "Decisions",
      value: 142,
      icon: GitPullRequest,
      color: "text-info",
    },
    { label: "Documents", value: 38, icon: FileText, color: "text-purple-400" },
    { label: "Workshops", value: 12, icon: MonitorPlay, color: "text-warning" },
    {
      label: "Messages",
      value: 1847,
      icon: MessageSquare,
      color: "text-success",
    },
  ];

  const tokens = [
    { name: "CLI_Agent_01", status: "active", lastUsed: "2 minutes ago" },
    { name: "GitHub_Action", status: "active", lastUsed: "1 day ago" },
    { name: "Webhook_Handler", status: "expired", lastUsed: "30 days ago" },
  ];

  return (
    <div className="h-full w-full bg-black flex flex-col md:flex-row overflow-hidden border-t border-white/5">
      {/* LEFT COLUMN: Identity (30%) */}
      <div className="w-full md:w-[30%] border-r border-white/5 flex flex-col shrink-0 bg-black">
        {/* Avatar Area */}
        <div className="p-12 border-b border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 border border-white/10 bg-white/[0.02] flex items-center justify-center text-white text-5xl font-mono mb-8">
            {user?.handle?.[0]?.toUpperCase() ||
              user?.displayName?.[0]?.toUpperCase() ||
              "O"}
          </div>
          <h1 className="text-[32px] font-header tracking-tighter text-white uppercase mb-2 leading-none">
            {user?.displayName || "COMMANDER"}
          </h1>
          <p className="text-micro mt-1">@{user?.handle || "user"}</p>

          <div className="flex flex-col gap-2 mt-8 w-full">
            <div className="border border-white/5 p-3 flex items-center justify-between text-micro bg-white/[0.01]">
              <span className="text-neutral-500">STATUS</span>
              <span className="text-[#00FF00]">ACTIVE</span>
            </div>
            <div className="border border-white/5 p-3 flex items-center justify-between text-micro bg-white/[0.01]">
              <span className="text-neutral-500">CLEARANCE</span>
              <span className="text-white">LEVEL 5</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-12 flex-1 bg-white/[0.01]">
          <h3 className="text-micro mb-6">Contact Information</h3>
          <div className="space-y-6 font-mono text-xs text-neutral-400">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Email</span>
              <span className="text-white text-right">
                {user?.email || "classified@sentry.os"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500">Member Since</span>
              <span className="text-white text-right">
                {formatDistanceToNow(new Date(), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500">Operator ID</span>
              <span className="text-white text-right">
                {user?.id?.slice(0, 8) || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Data & Stats (70%) */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-white/5">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="p-8 border-r border-b lg:border-b-0 border-white/5 last:border-r-0 flex flex-col justify-center gap-2"
            >
              <div className="text-neutral-600 mb-4">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-[48px] font-header text-white leading-none tracking-tighter">
                {stat.value}
              </div>
              <div className="text-micro">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* API Tokens */}
          <div className="flex-1 border-r border-white/5 flex flex-col min-w-0">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-micro">API Tokens</h3>
              <button className="text-[10px] font-mono text-white hover:text-neutral-400 transition-colors tracking-[0.1em] outline-none">
                [+ ADD TOKEN]
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {tokens.map((token) => (
                  <div
                    key={token.name}
                    className="flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <Key className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                      <div className="flex flex-col gap-1">
                        <div className="font-sans text-[15px] font-medium tracking-wide text-neutral-400 group-hover:text-white transition-colors">
                          {token.name}
                        </div>
                        <div className="text-[10px] tracking-[0.1em] font-mono text-neutral-500 uppercase">
                          LAST USED: {token.lastUsed}
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-mono tracking-[0.1em] px-2 py-1 border rounded-sm",
                        token.status === "active"
                          ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                          : "border-[#FF0000]/20 text-[#FF0000] bg-[#FF0000]/10",
                      )}
                    >
                      {token.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-micro">Keyboard Shortcuts</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {[
                  { keys: ["^", "K"], action: "Quick Search" },
                  { keys: ["^", "J"], action: "AI Assistant" },
                  { keys: ["^", "N"], action: "New Document" },
                  { keys: ["^", "P"], action: "Command Palette" },
                  { keys: ["^", "\\"], action: "Toggle Theme" },
                  { keys: ["^", "B"], action: "Toggle Nav" },
                ].map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <span className="font-sans text-[15px] tracking-wide font-medium text-neutral-400 group-hover:text-white transition-colors uppercase">
                      {shortcut.action}
                    </span>
                    <div className="flex items-center gap-2">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 font-mono text-[10px] bg-white/10 text-neutral-300 rounded-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
