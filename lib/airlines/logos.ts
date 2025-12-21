type AirlineIdent = {
  iata?: string | null;
  icao?: string | null;
  name?: string | null;
};

export function airlineLogoSrc(airline: AirlineIdent, variant: "logo" | "logo-transparent" | "logo-bg-white" | "logo-white" | "icon-transparent" | "tail" | "tail-3D" = "logo") {
  const params = new URLSearchParams();
  if (airline.icao) params.set("icao", airline.icao.toUpperCase());
  else if (airline.iata) params.set("iata", airline.iata.toUpperCase());
  else return null;
  params.set("variant", variant);
  return `/api/airlines/logo?${params.toString()}`;
}

export function airlineInitials(name?: string | null) {
  if (!name) return "✈";
  const cleaned = name.replace(/[^A-Za-z0-9\s]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  const out = letters.join("");
  return out || "✈";
}


