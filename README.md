# Turbli - Flight Turbulence Forecast

A full recreation of Turbli.com - real-time turbulence forecasts for flights using NOAA/NWS weather data.

## Project Status: Phase 1 Complete ✅

### What's Built (Phase 1 - Foundation)

- ✅ **Next.js 14** with App Router and TypeScript
- ✅ **Tailwind CSS** for styling with custom turbulence color scheme
- ✅ **PostgreSQL + Prisma ORM** for database management
- ✅ **Database schemas** for Airports and Aircraft
- ✅ **Seed data** for 22 major airports and 15 aircraft types
- ✅ **Design System** UI components (Button, Input, Card, Select, Spinner)
- ✅ **Header/Footer** layout components
- ✅ **Home page** with flight search form (mock data)
- ✅ **About page** explaining how Turbli works

### What's Next

**Phase 2: Flight Search Integration** (Week 3)
- Integrate AviationStack API for real flight data
- Airport autocomplete functionality
- Flight results display

**Phase 3: Route Calculation** (Week 4)
- Great Circle route calculation
- Mapbox map integration
- Flight path visualization

**Phase 4: Weather Data Integration** (Week 5-6)
- Aviation Weather Center JSON API
- Basic turbulence forecasting
- Route segment coloring

**Phase 5: GRIB2 Processing** (Week 7-8)
- Raw GRIB2 file parsing
- EDR extraction and interpolation
- Production-quality weather data

**Phase 6-8:** Aircraft adjustments, wind/thunderstorms, polish & deployment

## Tech Stack

- **Framework:** Next.js 14.2+ (App Router)
- **Language:** TypeScript 5.0+
- **Styling:** Tailwind CSS 4.1+
- **Database:** PostgreSQL with Prisma 7
- **Maps:** Mapbox GL JS (to be integrated)
- **Charts:** Recharts (to be integrated)
- **Weather:** NOAA WAFS GRIB2 files
- **Flight Data:** AviationStack API
- **Deployment:** Vercel (planned)

## Getting Started

### Prerequisites

- Node.js 18+ (or use nvm/fnm)
- pnpm package manager
- PostgreSQL database (local or Vercel Postgres)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env .env.local
# Edit .env.local with your DATABASE_URL

# Generate Prisma Client
pnpm prisma generate

# Run database migrations (when you have a database)
pnpm prisma db push

# Seed the database
pnpm prisma db seed
```

### Development

```bash
# Run development server
pnpm dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
/Users/leon/Sites/turb/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with Header/Footer
│   ├── page.tsx           # Home page with search form
│   ├── about/             # About page
│   └── globals.css        # Global styles with Tailwind
├── components/
│   ├── ui/                # Design system components
│   ├── search/            # Flight search components
│   ├── layout/            # Header, Footer
│   ├── map/               # Map components (coming in Phase 3)
│   └── forecast/          # Forecast components (coming in Phase 4)
├── lib/
│   └── db.ts              # Prisma client singleton
├── services/              # Business logic (to be built)
│   ├── flight/
│   ├── weather/
│   ├── route/
│   └── aircraft/
├── types/
│   └── index.ts           # TypeScript interfaces
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
└── public/                # Static assets
```

## Database Models

### Airport
- IATA/ICAO codes
- Name, city, country
- Coordinates (lat/lon)
- Elevation, timezone

### Aircraft
- IATA code
- Name, manufacturer
- Max takeoff weight, wing area
- Cruise speed/altitude
- Turbulence category (light/medium/heavy)

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# API Keys (to be added in later phases)
AVIATIONSTACK_API_KEY=
MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

## Key Features (Planned)

1. **Flight Search**
   - Origin/destination airport selection
   - Departure date/time (within 36 hours)
   - Optional aircraft type selection

2. **Turbulence Forecast**
   - Color-coded route visualization
   - Segment-by-segment turbulence breakdown
   - EDR (Eddy Dissipation Rate) values
   - Turbulence levels: smooth/light/moderate/severe/extreme

3. **Aircraft-Specific**
   - Different EDR thresholds based on aircraft weight
   - Wing loading calculations
   - Realistic turbulence sensitivity

4. **Additional Weather Data**
   - Wind speed/direction
   - Thunderstorm warnings
   - Runway crosswinds

## Data Sources

- **Turbulence:** NOAA/NWS WAFS GRIB2 EDR forecasts
- **Wind:** NOAA GFS wind components
- **Thunderstorms:** Met Office WAFC CB forecasts
- **Flights:** AviationStack API
- **Aircraft/Airport Data:** Compiled from public aviation databases

## Contributing

This is a recreation project following the implementation plan in `/Users/leon/.claude/plans/ancient-plotting-umbrella.md`.

## License

This is an educational recreation project.

## Acknowledgments

- Original Turbli.com by Ignacio Gallego-Marcos
- NOAA/NWS for weather data
- AviationStack for flight data
- Met Office for thunderstorm forecasts
