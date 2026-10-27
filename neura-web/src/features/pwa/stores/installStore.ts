import { create } from "zustand";

// Not in lib.dom.d.ts yet (Chromium-only event).
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface InstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
}

export const useInstallStore = create<InstallState>((set, get) => ({
  deferredPrompt: null,
  isInstalled: false,

  promptInstall: async () => {
    const event = get().deferredPrompt;
    if (!event) return false;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // A captured event can only be used once.
    set({ deferredPrompt: null });
    return outcome === "accepted";
  },
}));

// Registered at import time (from main.tsx): `beforeinstallprompt` can fire
// before React mounts, e.g. while the session check is still pending.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Hide Chrome's own mini-infobar on Android; our banner replaces it.
    event.preventDefault();
    useInstallStore.setState({
      deferredPrompt: event as BeforeInstallPromptEvent,
    });
  });

  window.addEventListener("appinstalled", () => {
    useInstallStore.setState({ deferredPrompt: null, isInstalled: true });
  });
}
