// How the current browser lets the user install the app.
// - "prompt":       Chromium (Chrome / Edge / Samsung / Opera …) on Android and desktop: native `beforeinstallprompt`
// - "ios":          iPhone / iPad: Share → Add to Home Screen
// - "macos-safari": Safari 17+ on macOS: File → Add to Dock
// - "unsupported":  e.g. Firefox desktop
export type InstallPlatform = "prompt" | "ios" | "macos-safari" | "unsupported";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unsupported";
  const ua = navigator.userAgent;

  // iPadOS 13+ reports itself as "Macintosh"; touch support gives it away.
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";

  const isMacSafari =
    /Macintosh/.test(ua) &&
    /Safari\//.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua);
  if (isMacSafari) return "macos-safari";

  if ("onbeforeinstallprompt" in window) return "prompt";

  return "unsupported";
}
