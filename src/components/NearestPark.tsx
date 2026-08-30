"use client";

import { useState } from "react";
import Link from "next/link";

interface ParkPoint {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

/**
 * "You're X mi from Y" — sits beside the wordmark. Geolocation is
 * click-to-enable only (no permission prompt on load), and what persists in
 * localStorage is the coordinate rounded to 0.1° (~7 mi) — enough to rank
 * parks, deliberately too coarse to identify an address.
 */
const STORAGE_KEY = "parkatlas-coarse-loc";

function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearest(parks: ParkPoint[], lat: number, lng: number) {
  let best: { park: ParkPoint; mi: number } | null = null;
  for (const park of parks) {
    const mi = haversineMi(lat, lng, park.lat, park.lng);
    if (!best || mi < best.mi) best = { park, mi };
  }
  return best!;
}

function readStored(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v.lat === "number" && typeof v.lng === "number" ? v : null;
  } catch {
    return null;
  }
}

export function NearestPark({ parks }: { parks: ParkPoint[] }) {
  // Lazy init from storage — no effect needed, no hydration mismatch risk
  // because the server renders the idle state and this only diverges after
  // hydration (useState initializer runs client-side on first client render).
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied" | "ready">("idle");
  const [hydratedFromStore, setHydratedFromStore] = useState(false);

  if (!hydratedFromStore && typeof window !== "undefined") {
    // One-time synchronous storage read on first client render.
    setHydratedFromStore(true);
    const stored = readStored();
    if (stored) {
      setLoc(stored);
      setStatus("ready");
    }
  }

  const locate = () => {
    if (!navigator.geolocation) return setStatus("denied");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coarse = {
          lat: Math.round(pos.coords.latitude * 10) / 10,
          lng: Math.round(pos.coords.longitude * 10) / 10,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(coarse));
        } catch {
          /* storage full/blocked — feature still works this page */
        }
        setLoc(coarse);
        setStatus("ready");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 3_600_000 }
    );
  };

  if (status === "ready" && loc) {
    const { park, mi } = nearest(parks, loc.lat, loc.lng);
    return (
      <Link
        href={`/parks/${park.code}`}
        className="hidden lg:inline font-mono text-mono-sm text-bone/60 hover:text-brass transition-colors"
      >
        You&rsquo;re ~{Math.round(mi).toLocaleString()} mi from {park.name} &rarr;
      </Link>
    );
  }
  if (status === "denied") return null; // asked and answered — don't nag
  return (
    <button
      onClick={locate}
      disabled={status === "locating"}
      className="hidden lg:inline font-mono text-mono-sm text-bone/40 hover:text-bone/70 transition-colors disabled:opacity-50"
      aria-label="Find your nearest national park (requests your location)"
    >
      {status === "locating" ? "Locating…" : "◎ Nearest park?"}
    </button>
  );
}
