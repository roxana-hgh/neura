import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInstallStore } from "@/features/pwa/stores/installStore";
import { getInstallPlatform, isStandalone } from "@/features/pwa/lib/platform";

const SEEN_KEY = "neura:install-prompt-seen";
const SHOW_DELAY_MS = 2500;
const AUTO_CLOSE_MS = 15_000;
const ANIMATION_MS = 500;

// hidden → entering (mounted off-screen) → open (slid in) → leaving (sliding out) → hidden
type Phase = "hidden" | "entering" | "open" | "leaving";

function hasSeenPrompt() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markPromptSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage unavailable (private mode): the banner may show again next visit.
  }
}

function InstallPrompt() {
  const deferredPrompt = useInstallStore((s) => s.deferredPrompt);
  const isInstalled = useInstallStore((s) => s.isInstalled);
  const promptInstall = useInstallStore((s) => s.promptInstall);
  const [platform] = useState(getInstallPlatform);
  const [phase, setPhase] = useState<Phase>("hidden");

  const canInstall =
    !isInstalled &&
    (platform === "ios" ||
      platform === "macos-safari" ||
      (platform === "prompt" && deferredPrompt !== null));

  // First visit only, shortly after the page settles.
  useEffect(() => {
    if (!canInstall || isStandalone() || hasSeenPrompt()) return;
    const timer = setTimeout(() => {
      markPromptSeen();
      setPhase("entering");
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [canInstall]);

  useEffect(() => {
    if (phase === "entering") {
      // Let the off-screen position paint once so the slide-in transition runs.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setPhase("open"));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    if (phase === "open") {
      const timer = setTimeout(() => setPhase("leaving"), AUTO_CLOSE_MS);
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setPhase("leaving");
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", onKeyDown);
      };
    }

    if (phase === "leaving") {
      const timer = setTimeout(() => setPhase("hidden"), ANIMATION_MS);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (phase === "hidden") return null;

  const isOpen = phase === "open";
  const close = () => setPhase("leaving");

  const handleInstall = () => {
    close();
    void promptInstall();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-3 sm:pt-4">
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="install-prompt-title"
        aria-describedby="install-prompt-desc"
        className={cn(
          "pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border",
          "bg-card/85 text-card-foreground shadow-2xl shadow-black/25 backdrop-blur-xl",
          "transition-[translate,scale,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "motion-reduce:transition-opacity",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-[calc(100%+1.5rem)] scale-95 opacity-0",
        )}
      >
        <div className="flex items-start gap-3 p-4 pr-11">
          <img
            src="/favicon/web-app-manifest-192x192.png"
            alt=""
            className="size-11 shrink-0 rounded-xl border border-white/10 shadow-sm"
          />

          <div className="min-w-0 flex-1">
            <p id="install-prompt-title" className="text-sm font-semibold leading-tight">
              Install Neura
            </p>

            <p
              id="install-prompt-desc"
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
            >
              {platform === "ios" && (
                <>
                  Tap <Share className="inline size-3.5 -translate-y-px" aria-hidden />{" "}
                  <span className="font-medium text-foreground">Share</span>, then{" "}
                  <SquarePlus className="inline size-3.5 -translate-y-px" aria-hidden />{" "}
                  <span className="font-medium text-foreground">Add to Home Screen</span>.
                </>
              )}
              {platform === "macos-safari" && (
                <>
                  In the menu bar choose{" "}
                  <span className="font-medium text-foreground">File → Add to Dock</span>{" "}
                  for a full app window.
                </>
              )}
              {platform === "prompt" &&
                "Get quick, full-screen access from your home screen or desktop. No app store needed."}
            </p>

            {platform === "prompt" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleInstall}>
                  <Download />
                  Install
                </Button>
                <Button size="sm" variant="ghost" onClick={close}>
                  Not now
                </Button>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2 rounded-full text-muted-foreground"
          onClick={close}
          aria-label="Dismiss"
        >
          <X />
        </Button>

        {/* Countdown until auto-close */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted/60">
          <div
            className="h-full origin-left bg-primary/50 transition-transform ease-linear"
            style={{
              transform: phase === "entering" ? "scaleX(1)" : "scaleX(0)",
              transitionDuration: phase === "entering" ? "0ms" : `${AUTO_CLOSE_MS}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
