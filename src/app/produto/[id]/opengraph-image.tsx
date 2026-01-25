import { ImageResponse } from "next/og";
import { PRODUCTS } from "@/constants/products";

export const alt = "VIOS LABS — Produto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@5.2.8/latin-400-normal.woff";

function getProductName(id: string): string {
  const product = PRODUCTS.find((p) => p.id === id);
  if (product) return product.name;
  return id
    .replace(/^prod_/, "Produto ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productName = getProductName(id);

  let fontData: ArrayBuffer | null = null;
  try {
    const res = await fetch(FONT_URL);
    if (res.ok) fontData = await res.arrayBuffer();
  } catch {
    /* fallback */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0B2820 0%, #0f3d32 50%, #0B2820 100%)",
          padding: "64px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 48,
          }}
        >
          <span
            style={{
              fontFamily: fontData ? "Playfair" : "serif",
              fontSize: 56,
              fontWeight: 400,
              color: "#F0EEE6",
              lineHeight: 1.15,
              letterSpacing: "0.02em",
            }}
          >
            {productName}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              fontFamily: fontData ? "Playfair" : "serif",
              fontSize: 22,
              color: "rgba(240, 238, 230, 0.5)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            VIOS LABS
          </span>
        </div>
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
