import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 60,
          background:
            "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(124,58,237,1) 100%)",
          color: "white",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>
            TurbCast
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>
            Flight turbulence forecast
          </div>
          <div style={{ fontSize: 26, opacity: 0.95, maxWidth: 900 }}>
            Calm, route-specific forecasts to help you feel more prepared.
          </div>
        </div>

        <div style={{ fontSize: 20, opacity: 0.95 }}>
          turbcast.com
        </div>
      </div>
    ),
    { ...size }
  );
}


