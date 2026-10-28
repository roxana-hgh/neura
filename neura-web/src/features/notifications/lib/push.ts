// Browser side of Web Push: service worker registration and this device's subscription.
// The service worker (public/sw.js) caches nothing, so registering it can't make the app stale.

import { api } from "@/lib/api";

export type PushPermission = NotificationPermission | "unsupported";

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const pushPermission = (): PushPermission =>
  pushSupported() ? Notification.permission : "unsupported";

const SW_URL = `/sw.js?api=${encodeURIComponent(import.meta.env.VITE_API_URL ?? "")}`;

/** Called once at startup. Doesn't ask for anything; it only lets pushes arrive. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const register = () =>
    navigator.serviceWorker
      .register(SW_URL, { scope: "/", updateViaCache: "none" })
      .catch((err) => console.warn("Service worker registration failed", err));
  if (document.readyState === "complete") void register();
  else window.addEventListener("load", () => void register(), { once: true });
}

const registration = () => navigator.serviceWorker.ready;

export async function getSubscription() {
  if (!pushSupported()) return null;
  return (await registration()).pushManager.getSubscription();
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Asks for permission (must run from a click) and registers this device with the API. */
export async function subscribePush(): Promise<PushPermission> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const reg = await registration();
  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const { publicKey } = (await api.get<{ publicKey: string }>("/notifications/public-key")).data;
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await api.post("/notifications/subscription", { subscription: subscription.toJSON(), time_zone: timeZone() });
  return "granted";
}

/** Stops pushes to this device (on "Turn off" and on sign out). Never throws. */
export async function unsubscribePush() {
  try {
    const subscription = await getSubscription();
    if (!subscription) return;
    await api.delete("/notifications/subscription", { data: { endpoint: subscription.endpoint } }).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    // nothing to clean up
  }
}

/**
 * On sign out: stop pushes to this device for the account, but keep the browser's
 * subscription so the next sign-in (syncSubscription) picks it up without asking again.
 */
export async function detachPushOnSignOut() {
  try {
    const subscription = await getSubscription();
    if (subscription) await api.delete("/notifications/subscription", { data: { endpoint: subscription.endpoint } });
  } catch {
    // best effort: never block signing out
  }
}

/**
 * Re-sends an existing subscription after sign-in (the browser may have rotated it, or
 * another account used this device) and keeps the stored time zone current.
 */
export async function syncSubscription() {
  try {
    if (pushPermission() !== "granted") return;
    const subscription = await getSubscription();
    if (subscription) {
      await api.post("/notifications/subscription", { subscription: subscription.toJSON(), time_zone: timeZone() });
    }
  } catch {
    // best effort
  }
}

/**
 * A system notification from the page itself (e.g. focus timer end). Goes through the
 * service worker when there is one: Android Chrome doesn't allow `new Notification()`.
 */
export async function showLocalNotification(title: string, options: NotificationOptions & { url?: string } = {}) {
  if (pushPermission() !== "granted") return;
  const { url = "/", ...rest } = options;
  const full: NotificationOptions = {
    icon: "/favicon/web-app-manifest-192x192.png",
    badge: "/favicon/notification-badge.png",
    ...rest,
    data: { url, actions: [] },
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return await reg.showNotification(title, full);
    new Notification(title, full);
  } catch {
    // notifications are a nice-to-have
  }
}
