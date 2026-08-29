/**
 * Per-section visual identity for the park detail pages. Each themed section
 * gets a quiet hue wash (5% alpha), a low-opacity background line pattern, a
 * short mono eyebrow label, and a reveal-motion flavor. Hues come from the
 * OVERLOOK seasonal set plus brass/glacial — they only ever appear as washes,
 * line patterns, and the 2px eyebrow tick, never as text or big fills.
 * Overview and Current Conditions deliberately get NO theme — restraint
 * anchors the system.
 */
export type SectionMotion = "rise" | "slide" | "scale" | "float";

export interface SectionTheme {
  hue: string; // hex
  eyebrow: string; // short mono label, uppercase
  pattern: "contour" | "ripple" | "marks" | "grid" | "bands" | "none";
  motion: SectionMotion;
}

export const SECTION_THEMES: Record<string, SectionTheme> = {
  "when-to-go": { hue: "#D6A63B", eyebrow: "Almanac", pattern: "bands", motion: "rise" },
  "hiking": { hue: "#B5502C", eyebrow: "Trail log", pattern: "contour", motion: "slide" },
  "must-see": { hue: "#B8862B", eyebrow: "Field marks", pattern: "marks", motion: "scale" },
  "water": { hue: "#7FA3AD", eyebrow: "Waters", pattern: "ripple", motion: "float" },
  "dining": { hue: "#6B8F5A", eyebrow: "Provisions", pattern: "grid", motion: "rise" },
  "crowds": { hue: "#6FA8B5", eyebrow: "Headcount", pattern: "bands", motion: "rise" },
};
