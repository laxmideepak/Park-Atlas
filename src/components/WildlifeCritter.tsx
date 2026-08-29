"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationControls, useReducedMotion, AnimatePresence, motion } from "motion/react";
import { WildlifeIcon } from "./WildlifeIcon";
import { WildlifeCard } from "./WildlifeCard";
import type { Wildlife } from "@/lib/data/park-wildlife";

const LEFT_BOUND = 6;
const RIGHT_BOUND = 82;

/** An ambient creature that wanders the hero illustration on its own — click it to stop and learn more. */
export function WildlifeCritter({ wildlife, accent }: { wildlife: Wildlife; accent: string }) {
  const controls = useAnimationControls();
  const bobControls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const facingRight = useRef(true);

  useEffect(() => {
    if (open) {
      controls.stop();
      bobControls.stop();
      return;
    }
    if (reduceMotion) return;

    let cancelled = false;
    async function roam() {
      while (!cancelled) {
        facingRight.current = !facingRight.current;
        const target = facingRight.current ? RIGHT_BOUND : LEFT_BOUND;
        await controls.start({
          left: `${target}%`,
          scaleX: facingRight.current ? 1 : -1,
          transition: { duration: 5 + Math.random() * 3, ease: "easeInOut" },
        });
      }
    }
    roam();
    bobControls.start({
      y: [0, -5, 0],
      transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
    });
    return () => {
      cancelled = true;
    };
  }, [open, reduceMotion, controls, bobControls]);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`See ${wildlife.name}`}
        initial={{ left: "12%" }}
        animate={controls}
        className="absolute bottom-[8%] z-10 cursor-pointer"
        style={{ transformOrigin: "center" }}
      >
        <motion.span animate={bobControls} className="block drop-shadow-md">
          <WildlifeIcon wildlife={wildlife} color={accent} size={38} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 z-20">
            <WildlifeCard wildlife={wildlife} accent={accent} onClose={() => setOpen(false)} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
