import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TOP_ROUTES, toRouteSlug } from "@/lib/seo/topRoutes";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/faq`, lastModified: now, priority: 0.7 },
  ];

  const routePages: MetadataRoute.Sitemap = TOP_ROUTES.map((r) => ({
    url: `${SITE_URL}/routes/${toRouteSlug(r.origin, r.destination)}`,
    lastModified: now,
    priority: 0.6,
  }));

  return [...staticPages, ...routePages];
}


