export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://turbcast.com").replace(/\/+$/, "");

export function absoluteUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}


