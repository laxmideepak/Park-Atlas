import type { SectionTheme } from "@/lib/section-themes";

/**
 * Decorative background line-work for ThemedSection. Server-safe and fully
 * deterministic (fixed-parameter sine wobble, no Math.random) — identical
 * markup every render. Strokes sit at 0.10–0.14 opacity of the section hue;
 * the only fills are the tiny "marks" stars, grid dots, and the 5%-alpha
 * bands. All SVGs are aria-hidden, absolute inset-0, pointer-events-none.
 */

const SVG_CLASS = "absolute inset-0 w-full h-full pointer-events-none";

/** Closed wobbly ring around (cx, cy) — a hand-drawn topo contour. */
function contourRing(cx: number, cy: number, rx: number, ry: number, wobble: number, phase: number): string {
  const pts: string[] = [];
  const N = 36;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const w = 1 + wobble * Math.sin(3 * t + phase) + wobble * 0.6 * Math.sin(5 * t + phase * 2);
    pts.push(`${(cx + rx * w * Math.cos(t)).toFixed(1)} ${(cy + ry * w * Math.sin(t)).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

const CONTOUR_RINGS = [
  contourRing(300, 112, 168, 104, 0.06, 0.8),
  contourRing(303, 114, 136, 82, 0.07, 2.1),
  contourRing(306, 116, 104, 62, 0.08, 3.9),
  contourRing(308, 117, 74, 43, 0.09, 5.2),
  contourRing(310, 118, 47, 27, 0.1, 0.3),
  contourRing(311, 118, 24, 13, 0.11, 4.4),
];

const RIPPLE_LINES = [26, 50, 78, 110, 146, 186].map((y, i) => {
  const a = i % 2 === 0 ? -7 : 7;
  return `M 0 ${y} Q 100 ${y + a} 200 ${y} T 400 ${y}`;
});

/** [x, y, scale] — sparse hardcoded scatter of small 4-point field marks. */
const MARKS: [number, number, number][] = [
  [36, 42, 1], [96, 64, 0.8], [58, 168, 1.1], [148, 120, 0.9], [210, 30, 1.2],
  [186, 176, 0.8], [262, 92, 1], [300, 160, 0.9], [342, 48, 1.1], [376, 132, 0.8],
];
const STAR = "M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z";

const BAND_YS = ["14%", "38%", "62%", "86%"];

export function SectionPattern({ kind, hue, uid }: { kind: SectionTheme["pattern"]; hue: string; uid: string }) {
  if (kind === "none") return null;

  if (kind === "contour" || kind === "ripple") {
    const paths = kind === "contour" ? CONTOUR_RINGS : RIPPLE_LINES;
    return (
      <svg className={SVG_CLASS} viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={hue} strokeOpacity={0.22} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    );
  }

  if (kind === "marks") {
    return (
      <svg className={SVG_CLASS} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {MARKS.map(([x, y, s], i) => (
          <path key={i} d={STAR} transform={`translate(${x} ${y}) scale(${s})`} fill={hue} fillOpacity={0.25} />
        ))}
      </svg>
    );
  }

  if (kind === "grid") {
    const id = `sp-grid-${uid}`;
    return (
      <svg className={SVG_CLASS} aria-hidden>
        <defs>
          <pattern id={id} width={24} height={24} patternUnits="userSpaceOnUse">
            <circle cx={2} cy={2} r={1} fill={hue} fillOpacity={0.25} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    );
  }

  // bands — thin full-width strips of the hue at 5% alpha
  return (
    <svg className={SVG_CLASS} aria-hidden>
      {BAND_YS.map((y) => (
        <rect key={y} x="0" y={y} width="100%" height="10" fill={hue} fillOpacity={0.09} />
      ))}
    </svg>
  );
}
