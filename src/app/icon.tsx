import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({
  id,
}: {
  id: Promise<string | number>;
}) {
  const sizeId = await id;
  const sizeNum = Number(sizeId) || 32;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a3323",
          color: "#f2f2f0",
          fontSize: sizeNum * 0.5,
          fontWeight: 200,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.05em",
        }}
      >
        V
      </div>
    ),
    { width: sizeNum, height: sizeNum }
  );
}
