"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Ambient park soundscape toggle (Vantara-inspired; the track itself is a
 * public-domain NPS Yellowstone recording — provenance in docs/sources.md
 * "Ambient audio"). Politeness rules mirror LivingHero's:
 *
 * 1. OFF by default, always. The Audio element is created on first enable
 *    only — zero audio bytes load until the user asks for sound.
 * 2. Save-Data on → never load audio; the toggle hides itself entirely.
 * 3. Preference persists per-session ("parkatlas-sound"). If sound was on,
 *    the next page load auto-resumes — but only after the first user
 *    interaction (pointerdown/keydown), because browsers veto audible
 *    autoplay before a gesture.
 * 4. Volume ramps 0 → 0.35 over ~1s on start (and back down on stop) so the
 *    stream never pops in; the file itself fades at the loop seam.
 */

const STORAGE_KEY = "parkatlas-sound";
/**
 * Dawn chorus songbirds, Yellowstone (NPS, public domain). Alternates, same
 * politeness + provenance rules (see docs/sources.md "Ambient audio"):
 * /audio/ambient-creek.mp3 and /audio/ambient-forest-birds.mp3.
 */
const SRC = "/audio/ambient-dawn-chorus.mp3";
const TARGET_VOLUME = 0.35;
const FADE_IN_MS = 1000;
const FADE_OUT_MS = 350;

/* Save-Data never changes within a page view — a no-op subscription plus a
 * one-shot snapshot is all useSyncExternalStore needs (and it reconciles the
 * server-rendered "visible" state without a hydration mismatch). */
const subscribeNoop = () => () => {};
const getSaveData = () =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const getServerSaveData = () => false;

function fadeTo(
  audio: HTMLAudioElement,
  rafRef: { current: number },
  target: number,
  ms: number,
  onDone?: () => void
) {
  cancelAnimationFrame(rafRef.current);
  const from = audio.volume;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    audio.volume = from + (target - from) * k;
    if (k < 1) rafRef.current = requestAnimationFrame(step);
    else onDone?.();
  };
  rafRef.current = requestAnimationFrame(step);
}

export function AmbientSound() {
  const [playing, setPlaying] = useState(false);
  // Save-Data on → never load audio; hide the toggle so nobody is teased.
  const hidden = useSyncExternalStore(subscribeNoop, getSaveData, getServerSaveData);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef(0);
  const playingRef = useRef(false);

  const enable = useCallback(() => {
    if (playingRef.current) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData === true) return;
    let audio = audioRef.current;
    if (!audio) {
      // First enable: only now does the browser request any audio bytes.
      audio = new Audio(SRC);
      audio.loop = true;
      audioRef.current = audio;
    }
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        playingRef.current = true;
        setPlaying(true);
        fadeTo(audio, rafRef, TARGET_VOLUME, FADE_IN_MS);
      })
      .catch(() => {
        /* autoplay veto — stay off, the toggle still reads unpressed */
      });
    try {
      sessionStorage.setItem(STORAGE_KEY, "on");
    } catch {}
  }, []);

  const disable = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "off");
    } catch {}
    const audio = audioRef.current;
    if (audio) fadeTo(audio, rafRef, 0, FADE_OUT_MS, () => audio.pause());
  }, []);

  // Session auto-resume: armed once per page load, resolved by the first gesture.
  useEffect(() => {
    if (getSaveData()) return;
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORAGE_KEY);
    } catch {}
    if (stored !== "on") return;
    const cleanup = () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    const resume = (e: Event) => {
      cleanup();
      // A gesture on the toggle itself is handled by its own click handler.
      if (e.target instanceof Node && buttonRef.current?.contains(e.target)) return;
      enable();
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return cleanup;
  }, [enable]);

  // Unmount (rare — Nav lives in the root layout): stop cleanly.
  useEffect(() => {
    const raf = rafRef;
    return () => {
      cancelAnimationFrame(raf.current);
      audioRef.current?.pause();
    };
  }, []);

  if (hidden) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={playing ? disable : enable}
      aria-pressed={playing}
      aria-label="Toggle ambient park sound"
      className={`tap-44 flex items-center gap-2 font-mono text-mono-sm uppercase tracking-wide transition-opacity cursor-pointer ${
        playing ? "text-brass" : "opacity-50 hover:opacity-80"
      }`}
    >
      <span aria-hidden className="flex items-end gap-[2px] h-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full bg-current ${playing ? "eq-bar" : "h-[3px]"}`}
            style={playing ? { animationDelay: `${i * 0.18}s` } : undefined}
          />
        ))}
      </span>
      SOUND
    </button>
  );
}
