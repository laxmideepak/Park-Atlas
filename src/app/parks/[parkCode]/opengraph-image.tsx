import { ImageResponse } from "next/og";
import { getParkSummary } from "@/lib/repo";
import { getParkAccent } from "@/lib/park-theme";
import { ALL_PARKS_MINI } from "@/lib/data/all-parks-mini";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ALL_PARKS_MINI.map((p) => ({ parkCode: p.code }));
}

export default async function Image(props: { params: Promise<{ parkCode: string }> }) {
  const { parkCode } = await props.params;
  const park = getParkSummary(parkCode);
  const accent = getParkAccent(parkCode);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#131711",
        }}
      >
        <span style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: accent }}>
          {park.state} &middot; National Park
        </span>
        <span style={{ fontSize: 104, color: "#EDE7DA", lineHeight: 1.05, marginTop: 20 }}>{park.name}</span>
        <span style={{ fontSize: 32, color: "rgba(237,231,218,0.6)", marginTop: 28 }}>{park.tagline}</span>
      </div>
    ),
    size
  );
}
