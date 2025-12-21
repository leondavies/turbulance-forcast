export type TopRoute = { origin: string; destination: string };
export type TopRouteGroup = {
  title: string;
  description?: string;
  routes: TopRoute[];
};

// Seed list for programmatic SEO.
//
// Goals:
// - Bias toward routes with consistently high real-world passenger demand (major hubs + trunk routes).
// - Include corridors people *actually search* for ("LAX to JFK turbulence", "SYD to MEL turbulence", etc.).
// - Keep it curated (quality over quantity). Expand over time using GSC query data.
//
// Notes:
// - Keep IATA codes uppercase.
// - We include both directions for most trunk routes because users search both ways.

type RoutePair = readonly [origin: string, destination: string];

function both(pairs: readonly RoutePair[]): TopRoute[] {
  return pairs.flatMap(([o, d]) => [
    { origin: o, destination: d },
    { origin: d, destination: o },
  ]);
}

function oneWay(pairs: readonly RoutePair[]): TopRoute[] {
  return pairs.map(([o, d]) => ({ origin: o, destination: d }));
}

function unique(routes: readonly TopRoute[]): TopRoute[] {
  const seen = new Set<string>();
  const out: TopRoute[] = [];
  for (const r of routes) {
    const origin = r.origin.toUpperCase();
    const destination = r.destination.toUpperCase();
    if (origin === destination) continue;
    const key = `${origin}-${destination}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ origin, destination });
  }
  return out;
}

// --- Oceania (NZ + AU) ---
const OCEANIA_TRUNK: RoutePair[] = [
  ["SYD", "MEL"],
  ["SYD", "BNE"],
  ["MEL", "BNE"],
  ["MEL", "PER"],
  ["SYD", "PER"],
  ["BNE", "PER"],
  ["ADL", "MEL"],
  ["ADL", "SYD"],
  ["CNS", "SYD"],
  ["CNS", "MEL"],
  ["AKL", "WLG"],
  ["AKL", "CHC"],
  ["WLG", "CHC"],
  ["AKL", "ZQN"],
  ["AKL", "SYD"],
  ["AKL", "MEL"],
  ["CHC", "MEL"],
  ["WLG", "SYD"],
  ["CHC", "SYD"],
];

// --- North America (high-demand domestic + transcon) ---
const US_TRUNK: RoutePair[] = [
  ["LAX", "SFO"],
  ["LAX", "LAS"],
  ["LAX", "SEA"],
  ["LAX", "DEN"],
  ["LAX", "ORD"],
  ["LAX", "DFW"],
  ["LAX", "IAH"],
  ["LAX", "ATL"],
  ["LAX", "MIA"],
  ["LAX", "JFK"],
  ["LAX", "EWR"],
  ["SFO", "SEA"],
  ["SFO", "DEN"],
  ["SFO", "ORD"],
  ["SFO", "DFW"],
  ["SFO", "IAH"],
  ["SFO", "ATL"],
  ["SFO", "JFK"],
  ["SFO", "EWR"],
  ["SEA", "DEN"],
  ["SEA", "ORD"],
  ["SEA", "JFK"],
  ["SEA", "EWR"],
  ["ORD", "JFK"],
  ["ORD", "EWR"],
  ["DFW", "JFK"],
  ["ATL", "JFK"],
  ["MIA", "JFK"],
  ["BOS", "JFK"],
  ["IAD", "LAX"],
  ["DCA", "JFK"],
];

const CANADA_TRUNK: RoutePair[] = [
  ["YYZ", "YVR"],
  ["YYZ", "YYC"],
  ["YVR", "YYC"],
  ["YUL", "YYZ"],
  ["YVR", "SEA"],
  ["YYZ", "EWR"],
  ["YYZ", "JFK"],
];

// --- Transatlantic (high-intent + big hubs) ---
const TRANSATLANTIC: RoutePair[] = [
  ["LHR", "JFK"],
  ["LHR", "EWR"],
  ["LHR", "LAX"],
  ["LHR", "SFO"],
  ["LGW", "JFK"],
  ["CDG", "JFK"],
  ["CDG", "EWR"],
  ["AMS", "JFK"],
  ["FRA", "JFK"],
  ["MUC", "JFK"],
  ["DUB", "JFK"],
  ["DUB", "BOS"],
  ["MAD", "JFK"],
  ["BCN", "JFK"],
  ["FCO", "JFK"],
  ["ZRH", "JFK"],
  ["VIE", "JFK"],
  ["BRU", "JFK"],
  ["MAN", "JFK"],
  ["LIS", "JFK"],
  ["CPH", "JFK"],
  ["ARN", "JFK"],
];

// --- Europe (big hubs + popular city pairs) ---
const EUROPE_TRUNK: RoutePair[] = [
  ["LHR", "AMS"],
  ["LHR", "CDG"],
  ["LHR", "FRA"],
  ["LHR", "MUC"],
  ["LHR", "DUB"],
  ["LHR", "MAD"],
  ["LHR", "BCN"],
  ["LHR", "FCO"],
  ["CDG", "AMS"],
  ["CDG", "FRA"],
  ["CDG", "MAD"],
  ["CDG", "BCN"],
  ["AMS", "FRA"],
  ["AMS", "MAD"],
  ["AMS", "BCN"],
  ["FRA", "MAD"],
  ["FRA", "FCO"],
  ["MUC", "FCO"],
  ["IST", "LHR"],
  ["IST", "CDG"],
  ["IST", "FRA"],
  ["IST", "AMS"],
  ["DUB", "LHR"],
  ["LIS", "MAD"],
  ["CPH", "ARN"],
  ["OSL", "ARN"],
  ["HEL", "ARN"],
];

// --- Middle East trunk (major connectors) ---
const MIDDLE_EAST: RoutePair[] = [
  ["DXB", "RUH"],
  ["DXB", "JED"],
  ["DXB", "DOH"],
  ["DXB", "AUH"],
  ["DOH", "RUH"],
  ["DOH", "JED"],
  ["RUH", "JED"],
  ["CAI", "JED"],
  ["CAI", "DXB"],
  ["LHR", "DXB"],
  ["LHR", "DOH"],
  ["CDG", "DXB"],
  ["FRA", "DXB"],
  ["AMS", "DXB"],
];

// --- Asia / SE Asia / East Asia trunk ---
const ASIA_PAC_TRUNK: RoutePair[] = [
  // SEA hubs
  ["SIN", "KUL"],
  ["SIN", "BKK"],
  ["SIN", "CGK"],
  ["SIN", "MNL"],
  ["BKK", "HKG"],
  ["BKK", "SIN"],
  ["KUL", "CGK"],
  ["HKG", "TPE"],
  ["HKG", "SIN"],
  ["HKG", "BKK"],
  ["ICN", "NRT"],
  ["ICN", "HND"],
  ["ICN", "KIX"],
  ["NRT", "TPE"],
  ["HND", "TPE"],
  ["PVG", "HKG"],
  ["PVG", "ICN"],
  ["PEK", "HKG"],
  ["CAN", "SIN"],
  ["DEL", "BOM"],
  ["DEL", "DXB"],
  ["BOM", "DXB"],
  ["DEL", "SIN"],
];

// --- Long-haul intercontinental corridors ---
const LONG_HAUL: RoutePair[] = [
  // US ↔ Asia
  ["LAX", "HND"],
  ["LAX", "NRT"],
  ["LAX", "ICN"],
  ["LAX", "HKG"],
  ["LAX", "SIN"],
  ["SFO", "HND"],
  ["SFO", "NRT"],
  ["SFO", "ICN"],
  ["SEA", "ICN"],
  ["YVR", "HND"],
  ["YVR", "ICN"],
  // Europe ↔ Asia
  ["LHR", "SIN"],
  ["LHR", "HKG"],
  ["LHR", "DEL"],
  ["LHR", "BOM"],
  ["FRA", "SIN"],
  ["CDG", "SIN"],
  ["AMS", "SIN"],
  ["IST", "SIN"],
  // Oceania ↔ US/Asia/ME
  ["SYD", "LAX"],
  ["SYD", "SFO"],
  ["MEL", "LAX"],
  ["AKL", "LAX"],
  ["AKL", "SFO"],
  ["SYD", "DXB"],
  ["SYD", "DOH"],
  ["MEL", "DXB"],
  ["SIN", "SYD"],
  ["SIN", "MEL"],
  ["HKG", "SYD"],
  ["HND", "SYD"],
];

// --- Latin America trunk (major markets) ---
const LATAM: RoutePair[] = [
  ["MEX", "CUN"],
  ["MEX", "GDL"],
  ["MEX", "MTY"],
  ["MEX", "LAX"],
  ["GRU", "GIG"],
  ["GRU", "EZE"],
  ["SCL", "LIM"],
  ["BOG", "MIA"],
  ["LIM", "MIA"],
  ["EZE", "MIA"],
];

export const TOP_ROUTE_GROUPS: TopRouteGroup[] = [
  {
    title: "Oceania",
    description: "Australia, New Zealand, and trans‑Tasman corridors.",
    routes: unique(both(OCEANIA_TRUNK)),
  },
  {
    title: "North America",
    description: "High-demand US domestic and US/Canada links.",
    routes: unique([...both(US_TRUNK), ...both(CANADA_TRUNK)]),
  },
  {
    title: "UK & Ireland",
    description: "Popular routes involving London and Dublin.",
    routes: unique(
      both([
        ["LHR", "AMS"],
        ["LHR", "CDG"],
        ["LHR", "FRA"],
        ["LHR", "MUC"],
        ["LHR", "DUB"],
        ["LHR", "MAD"],
        ["LHR", "BCN"],
        ["LHR", "FCO"],
        ["DUB", "LHR"],
        // Transatlantic from UK/IE
        ["LHR", "JFK"],
        ["LHR", "EWR"],
        ["LHR", "LAX"],
        ["LHR", "SFO"],
        ["LGW", "JFK"],
        ["DUB", "JFK"],
        ["DUB", "BOS"],
      ])
    ),
  },
  {
    title: "Europe",
    description: "Major intra‑Europe hubs and city pairs.",
    routes: unique(both(EUROPE_TRUNK)),
  },
  {
    title: "Asia‑Pacific",
    description: "Key East Asia and South‑East Asia trunk routes.",
    routes: unique(both(ASIA_PAC_TRUNK)),
  },
  {
    title: "Middle East",
    description: "Big connectors (DXB/DOH/RUH/JED) and links to Europe.",
    routes: unique(both(MIDDLE_EAST)),
  },
  {
    title: "Long-haul",
    description: "Intercontinental corridors (US↔Asia, EU↔Asia, Oceania↔US/Asia/ME).",
    routes: unique(both(LONG_HAUL)),
  },
  {
    title: "Latin America",
    description: "Major routes across Mexico and South America.",
    routes: unique(both(LATAM)),
  },
];

// Full list used for sitemap generation.
export const TOP_ROUTES: TopRoute[] = unique([
  ...TOP_ROUTE_GROUPS.flatMap((g) => g.routes),
  ...oneWay([]),
]);

export function toRouteSlug(origin: string, destination: string) {
  return `${origin.toLowerCase()}-to-${destination.toLowerCase()}`;
}


