import { getWildlifeIconKey, type Wildlife } from "@/lib/data/park-wildlife";

const INK = "#12151a";

/** Full-body flat-cartoon silhouettes, one per species family — not one generic face reused for every mammal. */
export function WildlifeIcon({ wildlife, color, size = 40 }: { wildlife: Wildlife; color: string; size?: number }) {
  const key = getWildlifeIconKey(wildlife);
  const p = { fill: color, stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden>
      {key === "bear" && (
        <>
          <rect x="18" y="58" width="8" height="14" rx="3" {...p} />
          <rect x="32" y="60" width="8" height="14" rx="3" {...p} />
          <rect x="48" y="60" width="8" height="14" rx="3" {...p} />
          <rect x="60" y="58" width="8" height="14" rx="3" {...p} />
          <path d="M12 52c-2-16 10-28 26-28s28 8 30 20c1 8-4 14-12 16-14 4-38 4-44-8z" {...p} />
          <circle cx="63" cy="34" r="11" {...p} />
          <circle cx="55" cy="24" r="4.5" {...p} />
          <circle cx="70" cy="24" r="4.5" {...p} />
          <circle cx="71" cy="36" r="3" fill={INK} />
        </>
      )}

      {key === "bison" && (
        <>
          <rect x="16" y="56" width="7" height="15" rx="2.5" {...p} />
          <rect x="28" y="58" width="7" height="15" rx="2.5" {...p} />
          <rect x="50" y="58" width="7" height="15" rx="2.5" {...p} />
          <rect x="62" y="56" width="7" height="15" rx="2.5" {...p} />
          <path d="M10 44c4-20 14-26 24-26 8 0 12 6 14 10 10 2 20 8 21 18 1 8-6 12-16 13-16 2-42 2-43-15z" {...p} />
          <circle cx="70" cy="46" r="9" {...p} />
          <path d="M62 40c-4-3-4-9 0-11" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx="75" cy="45" r="2.4" fill={INK} />
        </>
      )}

      {key === "wolf" && (
        <>
          <rect x="20" y="56" width="6" height="16" rx="2.5" {...p} />
          <rect x="32" y="58" width="6" height="16" rx="2.5" {...p} />
          <rect x="48" y="58" width="6" height="16" rx="2.5" {...p} />
          <rect x="58" y="56" width="6" height="16" rx="2.5" {...p} />
          <path d="M12 56c8 6 40 8 50 0 6-4 8-14 4-20-6-2-10 2-12 6-6-4-14-6-22-4-8-10-20-6-20 4 0 6 0 10 0 14z" {...p} />
          <path d="M62 36l14-10-4 14z" {...p} />
          <path d="M14 40c-6 4-8 10-4 16" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx="66" cy="34" r="2.2" fill={INK} />
        </>
      )}

      {key === "ungulate" && (
        <>
          <rect x="24" y="46" width="5" height="22" rx="2" {...p} />
          <rect x="34" y="48" width="5" height="22" rx="2" {...p} />
          <rect x="48" y="48" width="5" height="22" rx="2" {...p} />
          <rect x="58" y="46" width="5" height="22" rx="2" {...p} />
          <ellipse cx="42" cy="42" rx="26" ry="13" {...p} />
          <circle cx="66" cy="32" r="8" {...p} />
          <path d="M64 24l-5-10M69 24l1-11" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx="70" cy="31" r="2" fill={INK} />
        </>
      )}

      {key === "rodent" && (
        <>
          <path d="M14 58c10 4 20 4 28-2" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
          <ellipse cx="42" cy="48" rx="22" ry="16" {...p} />
          <circle cx="60" cy="36" r="10" {...p} />
          <circle cx="54" cy="26" r="4" {...p} />
          <circle cx="66" cy="27" r="4" {...p} />
          <rect x="26" y="60" width="6" height="10" rx="2.5" {...p} />
          <rect x="44" y="60" width="6" height="10" rx="2.5" {...p} />
          <circle cx="65" cy="37" r="2" fill={INK} />
        </>
      )}

      {key === "marine" && (
        <>
          <ellipse cx="40" cy="44" rx="28" ry="14" {...p} />
          <path d="M62 40c6-4 12-4 14 0-2 5-8 6-14 4z" {...p} />
          <path d="M14 44c-4 2-6 6-4 10" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <circle cx="20" cy="40" r="2" fill={INK} />
        </>
      )}

      {key === "bat" && (
        <>
          <path d="M40 30c-10-14-30-16-36-6-4 7 2 12 10 12-4 4-4 10 2 12 6-6 14-10 24-12z" {...p} />
          <path d="M40 30c10-14 30-16 36-6 4 7-2 12-10 12 4 4 4 10-2 12-6-6-14-10-24-12z" {...p} />
          <ellipse cx="40" cy="34" rx="7" ry="9" {...p} />
          <circle cx="37" cy="31" r="1.6" fill={INK} />
          <circle cx="43" cy="31" r="1.6" fill={INK} />
        </>
      )}

      {key === "turtle" && (
        <>
          <path d="M14 34l10-4 4-6z" {...p} />
          <path d="M64 46l4 8-12-2z" {...p} />
          <rect x="24" y="52" width="7" height="10" rx="2.5" {...p} />
          <rect x="46" y="54" width="7" height="10" rx="2.5" {...p} />
          <path d="M16 42c0-14 12-22 28-22s28 8 28 22-12 18-28 18-28-4-28-18z" {...p} />
          <path d="M44 22v36M28 26c6 4 6 30 0 34M60 26c-6 4-6 30 0 34" fill="none" stroke={INK} strokeWidth={2} opacity={0.6} />
        </>
      )}

      {key === "lizard" && (
        <>
          <path d="M8 46c8-6 10 4 16 2s6-8 12-8 8 6 14 6 8-6 14-4c4 6-2 12-8 12-2 6-8 8-14 6-6 4-14 4-20 0-6 2-12 0-14-6-2 0-4-4 0-8z" {...p} />
          <path d="M60 42l14-6-8 12z" {...p} />
          <path d="M14 44l-8-4M18 50l-8 2" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx="16" cy="42" r="2" fill={INK} />
        </>
      )}

      {key === "bird" && (
        <>
          <path d="M14 46c0-14 14-22 26-20 4-8 14-12 22-8-4 4-6 8-6 12 8 2 12 8 10 16-4 12-18 18-32 16-14-2-20-8-20-16z" {...p} />
          <path d="M40 34c8-2 16 0 20 6-8 2-16 0-20-6z" {...p} opacity={0.85} />
          <path d="M18 52c-6 4-10 10-8 16M30 54c-4 4-6 10-4 14" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx="58" cy="26" r="2" fill={INK} />
          <path d="M62 24l8-3-6 7z" {...p} />
        </>
      )}

      {key === "fish" && (
        <>
          <path d="M14 40c10-14 34-18 46-4-6 14-36 18-46 4z" {...p} />
          <path d="M60 36l10-8-2 12 2 12-10-8z" {...p} />
          <circle cx="24" cy="36" r="2.6" fill={INK} />
        </>
      )}

      {key === "butterfly" && (
        <>
          <ellipse cx="26" cy="30" rx="14" ry="10" {...p} transform="rotate(-20 26 30)" />
          <ellipse cx="54" cy="30" rx="14" ry="10" {...p} transform="rotate(20 54 30)" />
          <ellipse cx="26" cy="52" rx="12" ry="9" {...p} transform="rotate(15 26 52)" />
          <ellipse cx="54" cy="52" rx="12" ry="9" {...p} transform="rotate(-15 54 52)" />
          <ellipse cx="40" cy="40" rx="4" ry="14" fill={INK} />
        </>
      )}
    </svg>
  );
}
