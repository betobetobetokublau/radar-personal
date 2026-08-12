import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS ignora el manifest y usa este PNG para "Agregar a pantalla de inicio".
// Colores = tokens del tema "seria" (--c-accent / --c-on-accent); ImageResponse
// no puede leer variables CSS.
const ACCENT = "#1C4E80";
const ON_ACCENT = "#FFFFFF";

export default function AppleIcon() {
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
          color: ON_ACCENT,
          fontSize: 110,
          fontWeight: 700,
        }}
      >
        R
      </div>
    ),
    { ...size }
  );
}
