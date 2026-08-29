"use client";

import { createElement, Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const REVEAL_TAGS = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  li: motion.li,
  span: motion.span,
} as const;

type RevealTag = keyof typeof REVEAL_TAGS;

export type RevealVariant = "rise" | "slide" | "scale" | "float";

/** Per-section motion flavors. `rise` is the original recipe and stays the
 * default; the others only shift the initial offset (and, for float, a touch
 * more duration) so every variant still reads as the same animation language. */
const VARIANTS: Record<RevealVariant, { x: number; y: number; scale?: number; duration: number }> = {
  rise: { x: 0, y: 24, duration: 0.6 },
  slide: { x: -20, y: 0, duration: 0.6 },
  scale: { x: 0, y: 12, scale: 0.94, duration: 0.6 },
  float: { x: 0, y: 28, duration: 0.8 },
};

/** Wraps a single element with the site's one scroll-reveal recipe: fade + rise
 * 24px, once, 20% in view, 0.6s, same easing as the hero/Scroller on-mount
 * reveals so scroll-triggered content reads as the same animation language.
 * Explicit `x`/`y` props override the chosen variant's offsets. */
export function Reveal({
  children,
  delay = 0,
  y,
  x,
  as = "div",
  className,
  variant = "rise",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  as?: RevealTag;
  className?: string;
  variant?: RevealVariant;
}) {
  const reduce = useReducedMotion();
  const Tag = REVEAL_TAGS[as];
  const v = VARIANTS[variant];
  const withScale = v.scale != null;
  return (
    <Tag
      initial={reduce ? false : { opacity: 0, x: x ?? v.x, y: y ?? v.y, ...(withScale ? { scale: v.scale } : {}) }}
      whileInView={{ opacity: 1, x: 0, y: 0, ...(withScale ? { scale: 1 } : {}) }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: v.duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Staggers a list of children, capping the stagger at `cap` items so a long
 * list doesn't take seconds to finish revealing — item 6+ arrives alongside
 * item `cap`. Renders `as` as the real container element (e.g. the actual
 * grid div, or an `<ol>`) and `itemAs` as each child's wrapper (e.g. `<li>` —
 * must match what a valid child of `as` is). If a child is a keyed element
 * (including a `<Fragment key={...}>`), that key carries over to its wrapper. */
export function RevealGroup({
  children,
  stagger = 0.04,
  cap = 5,
  as = "div",
  className,
  style,
  itemAs = "div",
  itemClassName,
  variant = "rise",
}: {
  children: ReactNode;
  stagger?: number;
  cap?: number;
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  style?: CSSProperties;
  itemAs?: RevealTag;
  itemClassName?: string;
  variant?: RevealVariant;
}) {
  const items = Children.toArray(children);
  return createElement(
    as,
    { className, style },
    items.map((child, i) => (
      <Reveal
        key={isValidElement(child) && child.key != null ? child.key : i}
        delay={Math.min(i, cap) * stagger}
        as={itemAs}
        className={itemClassName}
        variant={variant}
      >
        {child}
      </Reveal>
    ))
  );
}
