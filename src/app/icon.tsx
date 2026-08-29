import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#131711",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M2 19 L9 7 L13 13.5 L16 9 L22 19 Z" fill="#B8862B" />
        </svg>
      </div>
    ),
    size
  );
}
