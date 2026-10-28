// Feedback when a focus session ends: a short chime, plus a system notification
// when the tab is in the background.

import { showLocalNotification } from "@/features/notifications/lib/push";

let audioCtx: AudioContext | null = null;

/** Call from a user gesture (Start) so the browser lets us play the chime later. */
export function primeFocusAlerts() {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    audioCtx = null;
  }
  if ("Notification" in window && Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

function playChime() {
  if (!audioCtx) return;
  const start = audioCtx.currentTime;
  [880, 1318.5].forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    const t = start + i * 0.18;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(t);
    osc.stop(t + 0.75);
  });
}

export function announceSessionComplete(minutes: number) {
  try {
    playChime();
  } catch {
    // Audio is a nice-to-have
  }
  if (document.visibilityState !== "hidden") return;
  void showLocalNotification("Focus session complete ✨", {
    body: `${minutes} ${minutes === 1 ? "minute" : "minutes"} of deep work. Come back to log it.`,
    tag: "neura-focus",
    url: "/focus",
  });
}
