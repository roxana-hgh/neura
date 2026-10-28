import type { ReactNode } from "react";
import { BellOff, BellRing, CalendarCheck, Moon, Send, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import SettingsSection from "@/features/settings/components/SettingsSection";
import {
  useDisablePush, useEnablePush, useNotificationSettings, usePushState, useSendTestNotification,
  useUpdateNotificationSettings,
} from "@/features/notifications/hooks/useNotifications";

const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;
const MORNING_HOURS = [5, 6, 7, 8, 9, 10, 11, 12];
const EVENING_HOURS = [15, 16, 17, 18, 19, 20, 21, 22];

interface RowProps {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  hour?: { value: number; options: number[]; onChange: (h: number) => void };
}

function PreferenceRow({ icon, title, description, checked, disabled, onChange, hour }: RowProps) {
  return (
    <div className={cn("flex items-start gap-3 py-3", disabled && "opacity-60")}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {hour && checked && (
          <Select value={String(hour.value)} onValueChange={(v) => hour.onChange(Number(v))} disabled={disabled}>
            <SelectTrigger size="sm" className="mt-2 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hour.options.map((h) => (
                <SelectItem key={h} value={String(h)}>{hourLabel(h)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} className="mt-1" />
    </div>
  );
}

function DeviceStatus() {
  const { data: push } = usePushState();
  const { data: settings } = useNotificationSettings();
  const enable = useEnablePush();
  const disable = useDisablePush();
  const sendTest = useSendTestNotification();

  if (!push) return <div className="h-16 animate-pulse rounded-lg bg-muted" />;

  if (!push.supported || settings?.pushAvailable === false) {
    return (
      <StatusBox tone="muted" icon={<BellOff className="size-4" />} title="Not available here">
        {push.supported
          ? "Push isn't set up on the server yet. In-app alerts still work."
          : "This browser can't show notifications. Try Chrome on Android, or install Neura as an app."}
      </StatusBox>
    );
  }

  if (push.permission === "denied") {
    return (
      <StatusBox tone="danger" icon={<BellOff className="size-4" />} title="Blocked by your browser">
        Tap the lock icon next to the address, open Permissions and allow Notifications. Then come back here.
      </StatusBox>
    );
  }

  if (!push.enabled) {
    return (
      <StatusBox
        tone="muted"
        icon={<BellRing className="size-4" />}
        title="Notifications are off on this device"
        action={
          <Button size="sm" onClick={() => enable.mutate()} disabled={enable.isPending}>
            Turn on
          </Button>
        }
      >
        Get reminders and task nudges even when Neura is closed.
      </StatusBox>
    );
  }

  return (
    <StatusBox
      tone="success"
      icon={<BellRing className="size-4" />}
      title="On for this device"
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>
            <Send className="size-3.5" /> Test
          </Button>
          <Button size="sm" variant="ghost" onClick={() => disable.mutate()} disabled={disable.isPending}>
            Turn off
          </Button>
        </div>
      }
    >
      {settings && settings.devices > 1 ? `Also on ${settings.devices - 1} other device${settings.devices > 2 ? "s" : ""}.` : "You'll hear from us only when it matters."}
    </StatusBox>
  );
}

function StatusBox({ tone, icon, title, action, children }: {
  tone: "success" | "danger" | "muted"; icon: ReactNode; title: string; action?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
      <span className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        tone === "success" && "bg-green-500/10 text-green-600 dark:text-green-400",
        tone === "danger" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
      {action}
    </div>
  );
}

function NotificationsSection() {
  const { data: settings } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const disabled = !settings;

  return (
    <SettingsSection
      title="Notifications"
      description="Pushes for due reminders and a short brief of your tasks. In-app alerts are always on."
    >
      <DeviceStatus />

      <div className="mt-2 divide-y divide-border">
        <PreferenceRow
          icon={<BellRing className="size-4" />}
          title="Reminders"
          description="The moment a reminder is due, with Done and Snooze right in the notification."
          checked={settings?.reminders ?? true}
          disabled={disabled}
          onChange={(v) => update.mutate({ reminders: v })}
        />
        <PreferenceRow
          icon={<Sun className="size-4" />}
          title="Morning brief"
          description="What's due today and anything overdue. Skipped on days with nothing due."
          checked={settings?.taskDigest ?? true}
          disabled={disabled}
          onChange={(v) => update.mutate({ task_digest: v })}
          hour={{
            value: settings?.taskDigestHour ?? 9,
            options: MORNING_HOURS,
            onChange: (h) => update.mutate({ task_digest_hour: h, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          }}
        />
        <PreferenceRow
          icon={<Moon className="size-4" />}
          title="Evening nudge"
          description="A heads-up if today's tasks are still open. Silent when you're done."
          checked={settings?.taskNudge ?? true}
          disabled={disabled}
          onChange={(v) => update.mutate({ task_nudge: v })}
          hour={{
            value: settings?.taskNudgeHour ?? 19,
            options: EVENING_HOURS,
            onChange: (h) => update.mutate({ task_nudge_hour: h, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          }}
        />
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarCheck className="size-3.5" />
        Times follow your time zone{settings ? ` (${settings.timeZone})` : ""}.
      </p>
    </SettingsSection>
  );
}

export default NotificationsSection;
