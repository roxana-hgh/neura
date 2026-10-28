import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addMinutes, differenceInHours } from "date-fns";
import { BellRing } from "lucide-react";
import { toast } from "@/lib/toast";
import { useNotificationInbox } from "@/features/notifications/hooks/useNotifications";
import { syncSubscription } from "@/features/notifications/lib/push";
import {
  announceKey, loadAnnounced, reminderSubtitle, saveAnnounced,
} from "@/features/notifications/lib/notificationText";
import { useCompleteReminder, useSnoozeReminder } from "@/features/reminders/hooks/useReminders";

/** A reminder that became due longer ago than this isn't toasted (the bell still lists it). */
const TOAST_MAX_AGE_HOURS = 12;
const MAX_TOASTS = 3;

/**
 * Layer 1 (app open): toasts a reminder the moment it's due, with Done / Snooze.
 * Also keeps the inbox fresh: after any successful mutation, and when the service worker
 * reports a push or a button pressed on a notification. Renders nothing.
 */
function NotificationWatcher() {
  const qc = useQueryClient();
  const { data } = useNotificationInbox();
  const { mutate: completeReminder } = useCompleteReminder();
  const { mutate: snoozeReminder } = useSnoozeReminder();
  const shown = useRef(new Set<string>());

  // this device's push subscription follows the signed-in account
  useEffect(() => {
    void syncSubscription();
  }, []);

  // anything that changes tasks / reminders can change what's due
  useEffect(
    () =>
      qc.getMutationCache().subscribe((event) => {
        if (event.type === "updated" && event.action.type === "success") {
          void qc.invalidateQueries({ queryKey: ["notifications", "inbox"] });
        }
      }),
    [qc],
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.source !== "neura-sw") return;
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["reminders"] });
      if (event.data.type === "action") void qc.invalidateQueries({ queryKey: ["tasks"] });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [qc]);

  useEffect(() => {
    if (!data) return;
    const due = data.reminders;
    const dueKeys = new Set(due.map(announceKey));

    // done / snoozed elsewhere: take its toast down
    for (const key of shown.current) {
      if (!dueKeys.has(key)) {
        toast.dismiss(key);
        shown.current.delete(key);
      }
    }

    const announced = loadAnnounced();
    const now = new Date();
    const fresh = due.filter(
      (r) => !announced.has(announceKey(r)) && differenceInHours(now, new Date(r.nextAt)) < TOAST_MAX_AGE_HOURS,
    );
    if (!fresh.length) return;

    fresh.slice(0, MAX_TOASTS).forEach((r) => {
      const key = announceKey(r);
      shown.current.add(key);
      toast.default(r.title, {
        id: key,
        description: reminderSubtitle(r, now),
        icon: <BellRing className="size-4 text-primary" />,
        duration: Infinity,
        action: { label: "Done", onClick: () => completeReminder({ id: r.id }) },
        cancel: {
          label: "Snooze 10m",
          onClick: () => snoozeReminder({ id: r.id, until: addMinutes(new Date(), 10) }),
        },
      });
    });
    if (fresh.length > MAX_TOASTS) {
      toast.default(`+${fresh.length - MAX_TOASTS} more reminders due`, {
        description: "Open the bell to see them all.",
        icon: <BellRing className="size-4 text-primary" />,
      });
    }

    fresh.forEach((r) => announced.add(announceKey(r)));
    saveAnnounced(announced);
  }, [data, completeReminder, snoozeReminder]);

  return null;
}

export default NotificationWatcher;
