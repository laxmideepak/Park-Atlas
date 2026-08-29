import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { MONTHS, monthByAbbr } from "@/lib/months";
import { bestByMonth } from "@/lib/repo";
import { getParkSummary } from "@/lib/repo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return MONTHS.map((m) => ({ month: m.abbr }));
}

export default async function Image(props: { params: Promise<{ month: string }> }) {
  const { month: monthParam } = await props.params;
  const month = monthByAbbr(monthParam);
  if (!month) notFound();
  const top = bestByMonth(month.abbr)[0];
  const topName = getParkSummary(top.park).name;

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
        <span style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#7FA3AD" }}>
          Best national parks in
        </span>
        <span style={{ fontSize: 118, color: "#EDE7DA", lineHeight: 1, marginTop: 20 }}>{month.name}</span>
        <span style={{ fontSize: 32, color: "#B8862B", marginTop: 28 }}>#1 right now: {topName}</span>
      </div>
    ),
    size
  );
}
