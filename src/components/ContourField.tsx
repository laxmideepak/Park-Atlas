/**
 * No-photo fallback (brief §5) — replaces the retired procedural WPA scapes
 * in page templates. Full-bleed ink field, fine topographic contour lines in
 * the park's own accent at 14% opacity, park name in display serif. Dignified
 * and honest: never a fake landscape standing in for a real photograph.
 */
export function ContourField({ name, accent }: { name: string; accent: string }) {
  const rings = [92, 78, 64, 50, 36, 22];
  return (
    <div className="relative w-full h-full bg-ink overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden>
        {rings.map((r, i) => (
          <ellipse
            key={r}
            cx={50 + (i % 2 === 0 ? -6 : 6)}
            cy={50 + (i % 2 === 0 ? 4 : -4)}
            rx={r}
            ry={r * 0.72}
            fill="none"
            stroke={accent}
            strokeOpacity={0.14}
            strokeWidth={0.6}
          />
        ))}
      </svg>
      <div className="grain-overlay" />
      <span className="relative font-display text-display-lg text-bone text-center px-6">{name}</span>
    </div>
  );
}
