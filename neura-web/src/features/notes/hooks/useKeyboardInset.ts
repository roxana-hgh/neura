import { useEffect, useState } from "react";

/**
 * Height (px) of the on-screen keyboard, measured with the Visual Viewport API.
 * Mobile browsers keep `position: fixed; bottom: 0` behind the keyboard, so a
 * bottom toolbar uses this to sit right above it.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      // Ignore small differences such as collapsing browser chrome
      setInset(covered > 80 ? Math.round(covered) : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
