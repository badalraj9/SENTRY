import * as React from "react";
import { useState, useEffect } from "react";
import { useAppSelector } from "../../store/hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Shield,
  Bell,
  Palette,
  Key,
  LogOut,
  ChevronRight,
  Terminal,
  Save,
} from "lucide-react";
import { cn } from "../../shared/lib/utils";
import { GlassButton } from "../../shared/ui";

type SettingsSection = "profile" | "preferences" | "security" | "notifications";

interface SettingsItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  section: SettingsSection;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Manage your account information",
    icon: User,
    section: "profile",
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Customize your experience",
    icon: Settings,
    section: "preferences",
  },
  {
    id: "security",
    label: "Security",
    description: "Password and authentication",
    icon: Shield,
    section: "security",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email and push notifications",
    icon: Bell,
    section: "notifications",
  },
];

export default function SettingsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");

  return (
    <div className="h-full w-full bg-transparent flex flex-col md:flex-row overflow-hidden p-6 gap-6">
      {/* LEFT COLUMN: Navigation (50%) */}
      <div className="w-full md:w-1/2 border border-neutral-200 border-b-[3px] rounded-3xl bg-white flex flex-col overflow-hidden shrink-0 shadow-sm transition-all duration-150">
        <div className="p-12 border-b border-neutral-200 border-dashed bg-transparent">
          <h2 className="text-[48px] font-header font-bold tracking-tighter leading-none text-black mb-4 uppercase">
            Settings
          </h2>
          <p className="text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500">
            System Configuration
          </p>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col bg-transparent">
          {SETTINGS_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.section)}
              className={cn(
                "w-full flex items-center justify-between p-8 border-b border-neutral-200 border-dashed transition-colors group outline-none",
                activeSection === item.section
                  ? "bg-neutral-50 text-black"
                  : "bg-transparent hover:bg-neutral-50/50 text-neutral-500",
              )}
            >
              <div className="flex items-center gap-6">
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    activeSection === item.section
                      ? "text-black"
                      : "text-neutral-500 group-hover:text-black",
                  )}
                />
                <div className="text-left flex flex-col gap-1">
                  <span
                    className={cn(
                      "font-sans text-[15px] tracking-wide font-medium transition-colors",
                      activeSection === item.section
                        ? "text-black"
                        : "text-neutral-600",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] tracking-[0.1em] font-mono uppercase transition-colors",
                      activeSection === item.section
                        ? "text-neutral-500"
                        : "text-neutral-400",
                    )}
                  >
                    {item.description}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform",
                    activeSection === item.section
                      ? "text-black"
                      : "text-neutral-500 group-hover:text-black group-hover:translate-x-1",
                  )}
                />
              </div>
            </button>
          ))}
        </div>

        <div className="p-8 border-t border-neutral-200 border-dashed bg-transparent">
          <button className="w-full btn-brutal border-[#D33E33]/30 hover:border-[#D33E33] text-[#D33E33] hover:bg-[#D33E33]/10 flex items-center justify-center gap-3 py-4 border-dashed rounded-full transition-colors bg-white">
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] tracking-[0.15em] font-mono uppercase">
              Sign Out
            </span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Content (50%) */}
      <div className="flex-1 border border-neutral-200 border-b-[3px] rounded-3xl bg-white flex flex-col overflow-y-auto shadow-sm transition-all duration-150">
        <div className="p-12">
          {activeSection === "profile" && <ProfileSection user={user} />}
          {activeSection === "preferences" && <PreferencesSection />}
          {activeSection === "security" && <SecuritySection />}
          {activeSection === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ user }: { user: any }) {
  const [handle, setHandle] = useState(user?.handle || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <div className="mb-12 border-b border-neutral-200 border-dashed pb-8 flex flex-col gap-4">
        <h3 className="text-[32px] font-header font-bold tracking-tighter leading-none text-black uppercase mt-2">
          Profile Information
        </h3>
        <p className="text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500">
          Identity Parameters
        </p>
      </div>

      <div className="space-y-10">
        <div>
          <label className="block text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500 mb-3">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-brutal w-full text-lg py-4 rounded-full"
            placeholder="OPERATOR NAME"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500 mb-3">
            System Handle
          </label>
          <div className="flex relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm pointer-events-none">
              @
            </span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="input-brutal w-full text-lg py-4 pl-12 rounded-full"
              placeholder="handle"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500 mb-3">
            Secure Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-brutal w-full text-lg py-4 rounded-full"
            placeholder="email@sentry.os"
          />
        </div>

        <div className="pt-12 mt-auto">
          <GlassButton
            onClick={handleSave}
            disabled={isSaving}
            size="md"
            className="w-full mt-4"
          >
            {isSaving ? "[ SAVING DIRECTIVES... ]" : "[ COMMIT CHANGES ]"}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

function PreferencesSection() {
  const [verboseMode, setVerboseMode] = useState(false);
  const [conciseMode, setConciseMode] = useState(true);
  const [earlyCapture, setEarlyCapture] = useState(true);

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <div className="mb-12 border-b border-neutral-200 border-dashed pb-8 flex flex-col gap-4">
        <h3 className="text-[32px] font-header font-bold tracking-tighter leading-none text-black uppercase mt-2">
          System Preferences
        </h3>
        <p className="text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500">
          Client Configuration
        </p>
      </div>

      <div className="space-y-0 border border-neutral-200 border-b-[3px] rounded-3xl overflow-hidden bg-white shadow-sm transition-all duration-150">
        <PrefToggle
          label="CONCISE MODE"
          desc="SHORTER AI FORMAT"
          value={conciseMode}
          onChange={() => setConciseMode(!conciseMode)}
          isFirst
        />
        <PrefToggle
          label="VERBOSE MODE"
          desc="DETAILED AI LOGS"
          value={verboseMode}
          onChange={() => setVerboseMode(!verboseMode)}
        />
        <PrefToggle
          label="EARLY CAPTURE"
          desc="PRE-FETCH CONTEXT"
          value={earlyCapture}
          onChange={() => setEarlyCapture(!earlyCapture)}
        />
      </div>
    </div>
  );
}

function PrefToggle({
  label,
  desc,
  value,
  onChange,
  isFirst = false,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: () => void;
  isFirst?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between p-8 hover:bg-neutral-50 transition-colors",
        !isFirst && "border-t border-neutral-200 border-dashed",
      )}
    >
      <div className="mb-4 sm:mb-0">
        <div className="font-sans text-[15px] tracking-wide font-medium text-black mb-2">
          {label}
        </div>
        <div className="text-[10px] tracking-[0.1em] text-neutral-500 font-mono uppercase">
          {desc}
        </div>
      </div>
      <button
        onClick={onChange}
        className={cn(
          "w-14 h-7 border border-dashed transition-colors outline-none relative group rounded-full",
          value
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-neutral-300 bg-white hover:border-neutral-400",
        )}
      >
        <div
          className={cn(
            "absolute top-[3px] w-5 h-5 transition-all rounded-full duration-150 ease-mechanical",
            value
              ? "left-[30px] bg-emerald-500"
              : "left-[3px] bg-neutral-300 group-hover:bg-neutral-400",
          )}
        />
      </button>
    </div>
  );
}

function SecuritySection() {
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <div className="mb-12 border-b border-neutral-200 border-dashed pb-8 flex flex-col gap-4">
        <h3 className="text-[32px] font-header font-bold tracking-tighter leading-none text-black uppercase mt-2">
          Security Controls
        </h3>
        <p className="text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500">
          Access & Authenticaton
        </p>
      </div>

      <div className="space-y-0 border border-neutral-200 border-b-[3px] shadow-sm rounded-3xl bg-white overflow-hidden transition-all duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 border-b border-neutral-200 border-dashed">
          <div className="mb-4 sm:mb-0 flex items-center gap-6">
            <Key className="w-5 h-5 text-neutral-500" />
            <div className="flex flex-col gap-2">
              <div className="font-sans text-[15px] font-medium text-black">
                Password
              </div>
              <div className="text-[10px] tracking-[0.1em] text-neutral-500 font-mono uppercase">
                LAST CHANGED 30 DAYS AGO
              </div>
            </div>
          </div>
          <GlassButton size="sm">[ UPDATE ]</GlassButton>
        </div>

        <PrefToggle
          label="2-FACTOR AUTH"
          desc="ENHANCE ACCOUNT SECURITY"
          value={twoFactor}
          onChange={() => setTwoFactor(!twoFactor)}
          isFirst
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 border-t border-neutral-200 border-dashed">
          <div className="mb-4 sm:mb-0 flex items-center gap-6">
            <LogOut className="w-5 h-5 text-neutral-500" />
            <div className="flex flex-col gap-2">
              <div className="font-sans text-[15px] font-medium text-black">
                Active Sessions
              </div>
              <div className="text-[10px] tracking-[0.1em] text-neutral-500 font-mono uppercase">
                MANAGE LOGIN TOKENS
              </div>
            </div>
          </div>
          <GlassButton size="sm" variant="danger">
            [ TERMINATE ALL ]
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [workshopNotifs, setWorkshopNotifs] = useState(true);
  const [decisionNotifs, setDecisionNotifs] = useState(true);

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <div className="mb-12 border-b border-neutral-200 border-dashed pb-8 flex flex-col gap-4">
        <h3 className="text-[32px] font-header font-bold tracking-tighter leading-none text-black uppercase mt-2">
          Comms Array
        </h3>
        <p className="text-[10px] tracking-[0.1em] font-mono uppercase text-neutral-500">
          Alert Routing Protocols
        </p>
      </div>

      <div className="space-y-0 border border-neutral-200 border-b-[3px] shadow-sm bg-white rounded-3xl overflow-hidden transition-all duration-150">
        <PrefToggle
          label="EMAIL RELAY"
          desc="EXTERNAL MESSAGING"
          value={emailNotifs}
          onChange={() => setEmailNotifs(!emailNotifs)}
          isFirst
        />
        <PrefToggle
          label="PUSH OVERRIDES"
          desc="BROWSER ALERTS"
          value={pushNotifs}
          onChange={() => setPushNotifs(!pushNotifs)}
        />
        <PrefToggle
          label="WORKSHOP PINGS"
          desc="SYNC SESSIONS"
          value={workshopNotifs}
          onChange={() => setWorkshopNotifs(!workshopNotifs)}
        />
        <PrefToggle
          label="DECISION PINGS"
          desc="COMMIT NOTIFICATIONS"
          value={decisionNotifs}
          onChange={() => setDecisionNotifs(!decisionNotifs)}
        />
      </div>
    </div>
  );
}
