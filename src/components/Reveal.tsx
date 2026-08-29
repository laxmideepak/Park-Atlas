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

/** Wraps a single element with the site's one scroll-reveal recipe: fade + rise
 * 24px, once, 20% in view, 0.6s, same easing as the hero/Scroller on-mount
 * reveals so scroll-triggered content reads as the same animation language. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  as = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  as?: RevealTag;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Tag = REVEAL_TAGS[as];
  return (
    <Tag
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
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
}: {
  children: ReactNode;
  stagger?: number;
  cap?: number;
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  style?: CSSProperties;
  itemAs?: RevealTag;
  itemClassName?: string;
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
      >
        {child}
      </Reveal>
    ))
  );
}
