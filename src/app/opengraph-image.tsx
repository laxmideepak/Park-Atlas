import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          63 U.S. National Parks
        </span>
        <span style={{ fontSize: 128, fontStyle: "italic", color: "#EDE7DA", lineHeight: 1, marginTop: 20 }}>
          {SITE_NAME}
        </span>
        <span style={{ fontSize: 34, color: "#B8862B", marginTop: 28 }}>{SITE_TAGLINE}</span>
      </div>
    ),
    size
  );
}
