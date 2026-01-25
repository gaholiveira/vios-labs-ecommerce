import { ImageResponse } from "next/og";

export const alt = "VIOS LABS — A Ciência da Longevidade";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@5.2.8/latin-400-normal.woff";

export default async function Image() {
  let fontData: ArrayBuffer | null = null;
  try {
    const res = await fetch(FONT_URL);
    if (res.ok) fontData = await res.arrayBuffer();
  } catch {
    /* fallback sem fonte custom */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#0B2820",
          padding: "80px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: fontData ? "Playfair" : "serif",
              fontSize: 72,
              fontWeight: 400,
              color: "#F0EEE6",
              letterSpacing: "0.02em",
            }}
          >
            VIOS LABS
          </span>
        </div>
        <span
          style={{
            fontSize: 20,
            color: "rgba(240, 238, 230, 0.75)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          A Ciência da Longevidade
        </span>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Playfair",
              data: fontData,
              style: "normal" as const,
              weight: 400,
            },
          ]
        : undefined,
    }
  );
}
