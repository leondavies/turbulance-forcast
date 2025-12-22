import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await fetch(new URL("../public/turbcast-logo.png", import.meta.url)).then(
    (res) => res.blob()
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(135deg, rgba(30,58,138,1) 0%, rgba(88,28,135,1) 100%)",
          color: "white",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="TurbCast"
            style={{ width: 420, height: "auto" }}
          />
          <div style={{ fontSize: 40, fontWeight: 700 }}>
            Flight turbulence forecast
          </div>
          <div style={{ fontSize: 28, opacity: 0.95, maxWidth: 900 }}>
            Know what to expect before you fly, using live aviation weather data.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            opacity: 0.95,
          }}
        >
          <div>Route-specific forecasts</div>
          <div>Based on aviation weather data</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


