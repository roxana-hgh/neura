import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  getSubscription, pushPermission, pushSupported, subscribePush, unsubscribePush,
} from "@/features/notifications/lib/push";
import type {
  NotificationInbox, NotificationSettings, NotificationSettingsInput,
} from "@/features/notifications/types/notification";

/** Due reminders + today's / overdue tasks for the header bell and in-app toasts. */
export function useNotificationInbox() {
  const today = format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["notifications", "inbox", today],
    queryFn: async () => (await api.get<NotificationInbox>("/notifications/inbox", { params: { today } })).data,
    // "due" changes with the clock, not just with mutations
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notifications", "settings"],
    queryFn: async () => (await api.get<NotificationSettings>("/notifications/settings")).data,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NotificationSettingsInput) =>
      (await api.patch<NotificationSettings>("/notifications/settings", input)).data,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["notifications", "settings"] });
      const previous = qc.getQueryData<NotificationSettings>(["notifications", "settings"]);
      if (previous) {
        qc.setQueryData<NotificationSettings>(["notifications", "settings"], {
          ...previous,
          ...(input.reminders !== undefined && { reminders: input.reminders }),
          ...(input.task_digest !== undefined && { taskDigest: input.task_digest }),
          ...(input.task_digest_hour !== undefined && { taskDigestHour: input.task_digest_hour }),
          ...(input.task_nudge !== undefined && { taskNudge: input.task_nudge }),
          ...(input.task_nudge_hour !== undefined && { taskNudgeHour: input.task_nudge_hour }),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["notifications", "settings"], ctx.previous);
      toast.error("Couldn't save notification settings");
    },
    onSuccess: (data) => qc.setQueryData(["notifications", "settings"], data),
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: async () => (await api.post<{ sent: number }>("/notifications/test")).data,
    onSuccess: () => toast.success("Test sent. Check your notifications"),
    onError: () => toast.error("Couldn't send a test. Try turning notifications off and on"),
  });
}

export interface PushState {
  supported: boolean;
  permission: ReturnType<typeof pushPermission>;
  /** This device is subscribed */
  enabled: boolean;
}

/** Push status of THIS browser / device. */
export function usePushState() {
  return useQuery({
    queryKey: ["notifications", "push-state"],
    queryFn: async (): Promise<PushState> => ({
      supported: pushSupported(),
      permission: pushPermission(),
      enabled: pushPermission() === "granted" && Boolean(await getSubscription()),
    }),
    staleTime: 30_000,
  });
}

export function useEnablePush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscribePush,
    onSuccess: (permission) => {
      if (permission === "granted") toast.success("Notifications are on 🔔");
      else if (permission === "denied") toast.error("Notifications are blocked. Allow them in your browser's site settings");
    },
    onError: () => toast.error("Couldn't turn on notifications"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useDisablePush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unsubscribePush,
    onSuccess: () => toast.default("Notifications are off on this device"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
