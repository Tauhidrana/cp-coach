import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Globe, Palette, User as UserIcon, Volume2 } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/use-auth";
import { useSettings, type UserSettings } from "@/hooks/use-settings";
import { useTheme, type ThemeMode } from "@/components/theme-provider";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CP Coach" },
      {
        name: "description",
        content: "Customize your CP Coach language, notifications, and theme.",
      },
    ],
  }),
  component: SettingsPage,
});

const LANGS = [
  { id: "auto", label: "Auto detect" },
  { id: "en", label: "English" },
  { id: "bn", label: "বাংলা" },
] as const;

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

function SettingsPage() {
  const { user, isGuest } = useAuth();
  const { settings, update, isLoading } = useSettings();
  const { mode, setMode } = useTheme();
  const [pushState, setPushState] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const name = (meta.full_name as string) ?? (meta.name as string) ?? user?.email ?? "—";

  const patch = (p: Partial<UserSettings>) => update.mutate(p);

  const enablePush = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications not supported on this device.");
      return;
    }
    const result = await Notification.requestPermission();
    setPushState(result);
    if (result === "granted") toast.success("Browser notifications enabled.");
    else toast.error("Permission denied. You can enable it from your browser settings.");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">Personalize your CP Coach experience.</p>
      </div>

      {/* Profile */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="size-4 text-primary" />
          <h2 className="font-display font-semibold">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <UserAvatar className="size-16" />
          <div className="min-w-0">
            <div className="text-base font-medium truncate">{name}</div>
            <div className="text-sm text-muted-foreground truncate">
              {isGuest ? "Guest session" : user?.email}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {meta.avatar_url ? "Synced from Google" : "Using gradient avatar fallback"}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Language */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="size-4 text-primary" />
          <h2 className="font-display font-semibold">Language</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Language used for AI Coach replies, reports, roadmaps, and tips.
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <button
              key={l.id}
              disabled={isLoading}
              onClick={() => patch({ language: l.id })}
              className={`px-4 py-2 text-sm rounded-xl ring-1 transition ${
                (settings?.language ?? "auto") === l.id
                  ? "bg-gradient-brand text-white ring-transparent shadow-glow"
                  : "ring-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h2 className="font-display font-semibold">Notifications</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={enablePush}
            disabled={pushState === "granted"}
            className="border-border/60"
          >
            {pushState === "granted" ? "Browser push enabled" : "Enable browser push"}
          </Button>
        </div>
        <div className="divide-y divide-border/40">
          <ToggleRow
            label="Daily Practice Reminder"
            description="Reminders at 6 PM and 9 PM if today's sheet isn't done."
            checked={settings?.notif_practice ?? true}
            onChange={(v) => patch({ notif_practice: v })}
          />
          <ToggleRow
            label="Contest Registration Reminder"
            description="24 hours and 2 hours before contests you haven't registered for."
            checked={settings?.notif_contest_reg ?? true}
            onChange={(v) => patch({ notif_contest_reg: v })}
          />
          <ToggleRow
            label="Contest Participation Reminder"
            description="30 minutes and 5 minutes before bookmarked contests start."
            checked={settings?.notif_contest_start ?? true}
            onChange={(v) => patch({ notif_contest_start: v })}
          />
          <ToggleRow
            label="AI Weekly Report"
            description="A weekly performance summary from your AI coach."
            checked={settings?.notif_weekly ?? true}
            onChange={(v) => patch({ notif_weekly: v })}
          />
          <ToggleRow
            label="Achievement Notifications"
            description="Streaks, rating-ups, and personal bests."
            checked={settings?.notif_achievement ?? true}
            onChange={(v) => patch({ notif_achievement: v })}
          />
          <ToggleRow
            icon={<Volume2 className="size-4 text-muted-foreground" />}
            label="Notification sound"
            description="Play a soft chime when a new notification arrives."
            checked={settings?.sound_enabled ?? true}
            onChange={(v) => patch({ sound_enabled: v })}
          />
        </div>
      </GlassCard>

      {/* Theme */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-4 text-primary" />
          <h2 className="font-display font-semibold">Theme</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`px-4 py-2 text-sm rounded-xl ring-1 transition ${
                mode === t.id
                  ? "bg-gradient-brand text-white ring-transparent shadow-glow"
                  : "ring-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
