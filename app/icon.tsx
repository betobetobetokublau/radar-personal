import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Los valores vienen de los tokens del tema "seria" en app/globals.css
// (--c-accent y --c-on-accent). ImageResponse genera un PNG fuera del DOM,
// así que no puede leer variables CSS — por eso van los valores literales.
const ACCENT = "#1C4E80";
const ON_ACCENT = "#FFFFFF";

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
          background: ACCENT,
          borderRadius: 6,
          color: ON_ACCENT,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        R
      </div>
    ),
    { ...size }
  );
}
