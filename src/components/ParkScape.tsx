import type { ReactNode } from "react";
import { ParkCode } from "@/lib/types";
import { getParkAccent, getSeed, getSilhouetteFamily, seededRandom, type SilhouetteFamily } from "@/lib/park-theme";

export { getParkAccent } from "@/lib/park-theme";

const INK = "#12151a";

/**
 * Illustrated skyline, one per park — WPA National Park poster style: flat
 * opaque color blocks, bold linework, a limited earthy palette (style only,
 * no historical WPA artwork reused — see docs/research). The 4 validation-
 * cohort parks get hand-illustrated scapes; the other 59 get a procedurally
 * generated one (deterministic per park code) so every park reads as its
 * own place rather than a reused template. Stands in for photography until
 * the NPS/NPGallery image pipeline (P0-10) lands.
 */
export function ParkScape({
  park,
  state = "",
  accent,
  aspect = "16/7",
  fill = false,
}: {
  park: string;
  /** Only needed for procedurally-generated (non-cohort) parks, to pick a silhouette family. */
  state?: string;
  accent?: string;
  aspect?: string;
  /** Fill mode: absolutely covers the parent instead of sizing by aspect ratio.
   * Use for hero banners where text overlays in normal flow decide the height. */
  fill?: boolean;
}) {
  const resolvedAccent = accent ?? getParkAccent(park);
  const scape = HAND_SCAPES[park as ParkCode] ?? proceduralScape(park, state, resolvedAccent);
  return (
    <div
      className={fill ? "absolute inset-0 w-full h-full overflow-hidden" : "relative w-full overflow-hidden rounded-sm"}
      style={fill ? undefined : { aspectRatio: aspect }}
    >
      <svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        <Sky bands={scape.sky} />
        {scape.content(resolvedAccent)}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-basalt via-basalt/15 to-transparent" />
    </div>
  );
}

/** Flat, stepped sky bands — screenprint-style graduation, not a smooth CSS blend. */
function Sky({ bands }: { bands: [string, string, string] }) {
  return (
    <>
      <rect x="0" y="0" width="800" height="140" fill={bands[0]} />
      <rect x="0" y="140" width="800" height="70" fill={bands[1]} />
      <rect x="0" y="210" width="800" height="60" fill={bands[2]} />
    </>
  );
}

function Sun({ cx, cy, r, fill, rays = true }: { cx: number; cy: number; r: number; fill: string; rays?: boolean }) {
  return (
    <g>
      {rays &&
        Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = cx + Math.cos(angle) * (r + 8);
          const y1 = cy + Math.sin(angle) * (r + 8);
          const x2 = cx + Math.cos(angle) * (r + 24);
          const y2 = cy + Math.sin(angle) * (r + 24);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={4} strokeLinecap="round" />;
        })}
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={INK} strokeWidth={3} />
    </g>
  );
}

interface Scape {
  sky: [string, string, string];
  content: (accent: string) => ReactNode;
}

const HAND_SCAPES: Record<ParkCode, Scape> = {
  acad: {
    sky: ["#1B2E3D", "#3E5C63", "#C9B896"],
    content: (accent) => (
      <>
        <Sun cx={640} cy={95} r={30} fill={accent} />
        {/* pine ridge */}
        <path d="M0,215 L90,175 L160,205 L260,160 L340,200 L430,150 L520,195 L620,165 L720,200 L800,180 V270 H0 Z" fill="#24382E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* granite cliff */}
        <path d="M0,255 L120,225 L260,250 L420,210 L560,245 L680,220 L800,240 V300 H0 Z" fill="#4B6B5E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* sea */}
        <path d="M0,285 H800 V350 H0 Z" fill="#2A4650" stroke={INK} strokeWidth={3} />
        <path d="M60,305 H220 M320,318 H460 M540,300 H700" stroke="#C9B896" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      </>
    ),
  },
  yell: {
    sky: ["#2B2320", "#6B4A2E", "#D9A94A"],
    content: (accent) => (
      <>
        {/* geyser steam */}
        <path d="M420,270 C412,220 402,190 398,140 C394,190 384,220 376,270 Z" fill="#E9E4D8" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* sawtooth range */}
        <path d="M0,210 L100,150 L200,205 L320,130 L440,205 L540,145 L660,200 L780,155 L800,165 V270 H0 Z" fill="#3B2E22" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* terraced geothermal basin */}
        <path d="M0,250 H260 V270 H460 V255 H800 V300 H0 Z" fill="#6B4A2E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <ellipse cx="398" cy="272" rx="34" ry="10" fill={accent} stroke={INK} strokeWidth={3} />
        {/* foreground ground */}
        <path d="M0,296 H800 V350 H0 Z" fill={INK} />
      </>
    ),
  },
  deva: {
    sky: ["#2A1710", "#7A3B22", "#E8B25A"],
    content: (accent) => (
      <>
        <Sun cx={150} cy={110} r={42} fill={accent} rays={false} />
        {/* far dune */}
        <path d="M0,230 Q120,195 240,225 T480,220 T720,232 L800,222 V300 H0 Z" fill="#8A5A34" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* near dune */}
        <path d="M0,260 Q140,232 300,258 T600,250 T800,262 V310 H0 Z" fill="#5F3D24" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* salt flat */}
        <path d="M0,292 H800 V350 H0 Z" fill="#D8C9A3" stroke={INK} strokeWidth={3} />
        <path d="M80,315 L140,308 L110,330 M400,320 L470,312 L430,338 M620,312 L690,318 L650,338" stroke="#8A5A34" strokeWidth={2.5} fill="none" opacity={0.7} />
      </>
    ),
  },
  grsm: {
    sky: ["#1E2A28", "#3C5049", "#B9C7B0"],
    content: () => (
      <>
        <circle cx={620} cy={90} r={26} fill="#DDE4D6" opacity={0.5} />
        {/* far ridge */}
        <path d="M0,170 L140,120 L280,168 L420,110 L560,165 L700,120 L800,150 V260 H0 Z" fill="#4A5A56" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" opacity={0.9} />
        {/* mid ridge */}
        <path d="M0,205 L160,155 L320,200 L480,145 L640,200 L800,165 V280 H0 Z" fill="#374440" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* near ridge */}
        <path d="M0,245 L180,195 L360,238 L560,185 L720,232 L800,205 V310 H0 Z" fill="#232B28" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {/* forest floor */}
        <path d="M0,290 H800 V350 H0 Z" fill={INK} />
      </>
    ),
  },
};

function mix(hexA: string, hexB: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(hexA.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(hexB.slice(i, i + 2), 16));
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function jaggedPath(rand: () => number, baseline: number, amp: number, bottom: number): string {
  const points = 6 + Math.floor(rand() * 3);
  const step = 800 / points;
  let d = `M0,${Math.round(baseline + (rand() - 0.5) * amp)}`;
  for (let i = 1; i <= points; i++) {
    const x = Math.round(i * step);
    const y = Math.round(baseline - rand() * amp * (i % 2 === 0 ? 1 : 0.4));
    d += ` L${x},${y}`;
  }
  d += ` V${bottom} H0 Z`;
  return d;
}

function dunePath(rand: () => number, baseline: number, amp: number, bottom: number): string {
  let d = `M0,${Math.round(baseline)}`;
  for (let x = 150; x <= 800; x += 150) {
    const cx = x - 75;
    const cy = Math.round(baseline - amp - rand() * amp * 0.6);
    d += ` Q${cx},${cy} ${x},${Math.round(baseline - (rand() - 0.3) * amp * 0.6)}`;
  }
  d += ` V${bottom} H0 Z`;
  return d;
}

function proceduralScape(code: string, state: string, accent: string): Scape {
  const family: SilhouetteFamily = getSilhouetteFamily(code, state);
  const rand = seededRandom(getSeed(code));

  const skyByFamily: Record<SilhouetteFamily, [string, string, string]> = {
    mountain: ["#232323", mix("#232323", accent, 0.5), mix("#232323", accent, 0.85)],
    desert: ["#241a12", mix("#241a12", accent, 0.55), mix("#241a12", accent, 0.9)],
    coastal: ["#182530", mix("#182530", accent, 0.4), mix("#182530", accent, 0.75)],
    forest: ["#1c2422", mix("#1c2422", accent, 0.35), mix("#1c2422", accent, 0.65)],
  };

  const layerBase = mix(INK, accent, 0.55);
  const layerMid = mix(INK, accent, 0.4);
  const layerNear = mix(INK, accent, 0.22);

  const content = (a: string): ReactNode => {
    if (family === "desert") {
      return (
        <>
          <Sun cx={120 + rand() * 100} cy={90 + rand() * 40} r={34 + rand() * 16} fill={a} rays={rand() > 0.5} />
          <path d={dunePath(rand, 230, 30, 300)} fill={layerBase} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d={dunePath(rand, 265, 26, 320)} fill={layerMid} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M0,296 H800 V350 H0 Z" fill={mix(INK, "#D8C9A3", 0.7)} stroke={INK} strokeWidth={3} />
        </>
      );
    }
    if (family === "mountain") {
      return (
        <>
          <Sun cx={620} cy={90} r={22} fill={a} />
          <path d={jaggedPath(rand, 190, 60, 270)} fill={layerBase} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d={jaggedPath(rand, 235, 45, 300)} fill={layerMid} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M0,296 H800 V350 H0 Z" fill={layerNear} stroke={INK} strokeWidth={3} />
        </>
      );
    }
    if (family === "coastal") {
      return (
        <>
          <Sun cx={660} cy={95} r={26} fill={a} />
          <path d={jaggedPath(rand, 210, 40, 270)} fill={layerBase} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d={jaggedPath(rand, 250, 30, 300)} fill={layerMid} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M0,285 H800 V350 H0 Z" fill={layerNear} stroke={INK} strokeWidth={3} />
          <path d="M60,305 H220 M320,318 H460 M540,300 H700" stroke="#C9B896" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        </>
      );
    }
    // forest — soft hazy layered ridges
    return (
      <>
        <circle cx={600} cy={90} r={22} fill={a} opacity={0.55} />
        <path d={jaggedPath(rand, 195, 45, 260)} fill={layerBase} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" opacity={0.9} />
        <path d={jaggedPath(rand, 235, 40, 285)} fill={layerMid} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d={jaggedPath(rand, 265, 35, 310)} fill={layerNear} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M0,290 H800 V350 H0 Z" fill={INK} />
      </>
    );
  };

  return { sky: skyByFamily[family], content };
}
