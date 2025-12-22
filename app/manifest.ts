import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TurbCast — Flight turbulence forecast",
    short_name: "TurbCast",
    description:
      "Check expected turbulence for your flight route using live aviation weather data.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#2563eb",
    icons: [
      {
        src: `${SITE_URL}/turbcast-favicon-square.png`,
        sizes: "552x552",
        type: "image/png",
      },
      {
        src: `${SITE_URL}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}


