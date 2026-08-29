"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/** Global smooth scroll. Lenis auto-disables smoothing under
 * prefers-reduced-motion (verified in its source) — no override needed. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.09 }}>
      {children}
    </ReactLenis>
  );
}
