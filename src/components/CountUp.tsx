"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring, useMotionValueEvent, useReducedMotion } from "motion/react";

/** A number that counts up from 0 once it scrolls into view. Reduced motion
 * renders the final value immediately, no animation. Scoped intentionally to
 * single clean numeric values (e.g. acreage) — see the design spec for why
 * this isn't applied to every number on the site. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value.toLocaleString());
    } else if (inView) {
      motionValue.set(value);
    }
  }, [inView, reduce, value, motionValue]);

  useMotionValueEvent(spring, "change", (v) => {
    if (!reduce) setDisplay(Math.round(v).toLocaleString());
  });

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
