/* Neura service worker: push notifications only.
 *
 * It deliberately has NO fetch handler and caches nothing, so it can never serve a stale
 * app: every page load and asset still comes straight from the network, as without a
 * service worker. A new version takes over at once (skipWaiting + clients.claim), and it's
 * registered with `updateViaCache: "none"`, so the browser always re-checks this file.
 *
 * The API origin comes from the registration URL: /sw.js?api=https://api.example.com
 */

const API = new URL(self.location.href).searchParams.get("api") || "";
const ICON = "/favicon/web-app-manifest-192x192.png";
const BADGE = "/favicon/notification-badge.png";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

const windows = () => self.clients.matchAll({ type: "window", includeUncontrolled: true });

/** Tell open tabs to refresh their notification inbox / lists. */
async function broadcast(message) {
  for (const client of await windows()) client.postMessage({ source: "neura-sw", ...message });
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Neura", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil((async () => {
    const clients = await windows();
    // The app is open and in front: it shows its own in-app toast instead.
    if (data.kind !== "test" && clients.some((c) => c.focused)) {
      await broadcast({ type: "push", kind: data.kind });
      return;
    }

    await self.registration.showNotification(data.title || "Neura", {
      body: data.body || "",
      tag: data.tag,
      renotify: Boolean(data.tag),
      icon: ICON,
      badge: BADGE,
      timestamp: Date.now(),
      data: { url: data.url || "/", actions: data.actions || [] },
      actions: (data.actions || []).slice(0, 2).map(({ action, title }) => ({ action, title })),
    });
    await broadcast({ type: "push", kind: data.kind });
  })());
});

/** Focus an open tab (navigating it to `url`) or open a new one. */
async function openApp(url) {
  const target = new URL(url, self.location.origin).href;
  const clients = await windows();
  const client = clients.find((c) => c.url.startsWith(self.location.origin));
  if (client) {
    await client.focus();
    if (client.url !== target && "navigate" in client) {
      try {
        await client.navigate(target);
      } catch {
        // uncontrolled tab: it can't be navigated, but it's focused
      }
    }
    return;
  }
  await self.clients.openWindow(target);
}

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const { url = "/", actions = [] } = notification.data || {};
  const chosen = actions.find((a) => a.action === event.action);
  notification.close();

  event.waitUntil((async () => {
    // A button with a token runs in the background (Done / Snooze) without opening the app.
    if (chosen && chosen.token && API) {
      try {
        const res = await fetch(`${API}/api/notifications/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: chosen.token }),
          credentials: "omit",
        });
        if (res.ok) {
          await broadcast({ type: "action" });
          return;
        }
      } catch {
        // offline: fall through and open the app so it can be done there
      }
    }
    await openApp(url);
  })());
});
