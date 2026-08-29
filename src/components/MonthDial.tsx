import { MONTHS, SEASON_ACCENT } from "@/lib/months";
import { MonthAbbr } from "@/lib/types";

const CX = 160;
const CY = 160;
const R = 140;

/**
 * The signature nav element (PRD 6.6 "By Month" is the primary discovery
 * axis). Pure links, no client JS required — works before hydration.
 */
export function MonthDial({
  activeMonth,
  subtitle,
  basePath = "/discover/month",
}: {
  activeMonth: MonthAbbr;
  subtitle: string;
  basePath?: string;
}) {
  const active = MONTHS.find((m) => m.abbr === activeMonth)!;
  const accent = SEASON_ACCENT[active.season];

  return (
    <div className="flex flex-col items-center gap-4" style={{ color: accent }}>
      <div className="relative w-[min(320px,80vw)] aspect-square">
        <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ffffff22" strokeWidth={1} />
          {MONTHS.map((m, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const x = CX + R * Math.cos(angle);
            const y = CY + R * Math.sin(angle);
            const isActive = m.abbr === activeMonth;
            return (
              <a key={m.abbr} href={`${basePath}/${m.abbr}`} aria-label={`Select ${m.name}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 9 : 6}
                  fill={isActive ? "currentColor" : "#171b1f"}
                  stroke={isActive ? "currentColor" : "#cfc9b8"}
                  strokeWidth={1.5}
                />
                <text
                  x={x}
                  y={y - 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  fill={isActive ? "currentColor" : "#cfc9b8"}
                  fontWeight={isActive ? 700 : 400}
                >
                  {m.abbr.toUpperCase()}
                </text>
              </a>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="font-display text-2xl uppercase tracking-wide" style={{ color: accent }}>
            {active.abbr.toUpperCase()}
          </div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wide text-paper-dim max-w-[16ch]">
            {subtitle}
          </div>
        </div>
      </div>
      <p className="text-xs text-paper-dim text-center max-w-[26ch]">
        Turn the dial &mdash; every card below recalculates for the month you pick.
      </p>
    </div>
  );
}
