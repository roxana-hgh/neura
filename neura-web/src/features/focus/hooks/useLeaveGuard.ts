import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * While `active`, asks before the user leaves the page:
 * - closing / reloading the tab shows the browser's own "Leave site?" prompt
 * - in-app navigation is blocked; render a dialog from the returned blocker
 */
export function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // still required by some browsers to show the prompt
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);

  return useBlocker(
    ({ currentLocation, nextLocation }) => active && currentLocation.pathname !== nextLocation.pathname,
  );
}
