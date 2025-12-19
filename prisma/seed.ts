import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

const airports = [
  // United States
  { iata: 'JFK', icao: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', latitude: 40.6413, longitude: -73.7781, elevation: 13, timezone: 'America/New_York' },
  { iata: 'LAX', icao: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', latitude: 33.9416, longitude: -118.4085, elevation: 126, timezone: 'America/Los_Angeles' },
  { iata: 'ORD', icao: 'KORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', latitude: 41.9742, longitude: -87.9073, elevation: 672, timezone: 'America/Chicago' },
  { iata: 'SFO', icao: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', latitude: 37.6213, longitude: -122.3790, elevation: 13, timezone: 'America/Los_Angeles' },
  { iata: 'MIA', icao: 'KMIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', latitude: 25.7959, longitude: -80.2870, elevation: 8, timezone: 'America/New_York' },
  { iata: 'SEA', icao: 'KSEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', latitude: 47.4502, longitude: -122.3088, elevation: 433, timezone: 'America/Los_Angeles' },
  { iata: 'DEN', icao: 'KDEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', latitude: 39.8561, longitude: -104.6737, elevation: 5431, timezone: 'America/Denver' },

  // Europe
  { iata: 'LHR', icao: 'EGLL', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', latitude: 51.4700, longitude: -0.4543, elevation: 83, timezone: 'Europe/London' },
  { iata: 'CDG', icao: 'LFPG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', latitude: 49.0097, longitude: 2.5479, elevation: 392, timezone: 'Europe/Paris' },
  { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', latitude: 50.0379, longitude: 8.5622, elevation: 364, timezone: 'Europe/Berlin' },
  { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', latitude: 52.3105, longitude: 4.7683, elevation: -11, timezone: 'Europe/Amsterdam' },
  { iata: 'MAD', icao: 'LEMD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', latitude: 40.4719, longitude: -3.5626, elevation: 1998, timezone: 'Europe/Madrid' },

  // Asia
  { iata: 'HND', icao: 'RJTT', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', latitude: 35.5494, longitude: 139.7798, elevation: 35, timezone: 'Asia/Tokyo' },
  { iata: 'NRT', icao: 'RJAA', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', latitude: 35.7720, longitude: 140.3929, elevation: 141, timezone: 'Asia/Tokyo' },
  { iata: 'SIN', icao: 'WSSS', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', latitude: 1.3644, longitude: 103.9915, elevation: 22, timezone: 'Asia/Singapore' },
  { iata: 'HKG', icao: 'VHHH', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China', latitude: 22.3080, longitude: 113.9185, elevation: 28, timezone: 'Asia/Hong_Kong' },
  { iata: 'ICN', icao: 'RKSI', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', latitude: 37.4602, longitude: 126.4407, elevation: 23, timezone: 'Asia/Seoul' },

  // Middle East
  { iata: 'DXB', icao: 'OMDB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', latitude: 25.2532, longitude: 55.3657, elevation: 62, timezone: 'Asia/Dubai' },
  { iata: 'DOH', icao: 'OTHH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', latitude: 25.2731, longitude: 51.6080, elevation: 13, timezone: 'Asia/Qatar' },

  // Oceania
  { iata: 'SYD', icao: 'YSSY', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', latitude: -33.9399, longitude: 151.1753, elevation: 21, timezone: 'Australia/Sydney' },
  { iata: 'MEL', icao: 'YMML', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', latitude: -37.6690, longitude: 144.8410, elevation: 434, timezone: 'Australia/Melbourne' },
  { iata: 'AKL', icao: 'NZAA', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', latitude: -37.0082, longitude: 174.7850, elevation: 23, timezone: 'Pacific/Auckland' },
  { iata: 'CHC', icao: 'NZCH', name: 'Christchurch International Airport', city: 'Christchurch', country: 'New Zealand', latitude: -43.4894, longitude: 172.5320, elevation: 123, timezone: 'Pacific/Auckland' },
]

const aircraft = [
  // Boeing
  { iata: 'B738', name: 'Boeing 737-800', manufacturer: 'Boeing', maxTakeoffWeight: 79010, wingArea: 125.0, cruiseSpeed: 453, cruiseAltitude: 41000, typicalFlightLevel: 370, category: 'medium' },
  { iata: 'B77W', name: 'Boeing 777-300ER', manufacturer: 'Boeing', maxTakeoffWeight: 351534, wingArea: 427.8, cruiseSpeed: 490, cruiseAltitude: 43100, typicalFlightLevel: 390, category: 'heavy' },
  { iata: 'B788', name: 'Boeing 787-8 Dreamliner', manufacturer: 'Boeing', maxTakeoffWeight: 227930, wingArea: 325.0, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 410, category: 'heavy' },
  { iata: 'B789', name: 'Boeing 787-9 Dreamliner', manufacturer: 'Boeing', maxTakeoffWeight: 254011, wingArea: 325.0, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 410, category: 'heavy' },
  { iata: 'B744', name: 'Boeing 747-400', manufacturer: 'Boeing', maxTakeoffWeight: 412775, wingArea: 511.0, cruiseSpeed: 490, cruiseAltitude: 45100, typicalFlightLevel: 400, category: 'heavy' },

  // Airbus
  { iata: 'A320', name: 'Airbus A320', manufacturer: 'Airbus', maxTakeoffWeight: 78000, wingArea: 122.6, cruiseSpeed: 447, cruiseAltitude: 39100, typicalFlightLevel: 370, category: 'medium' },
  { iata: 'A321', name: 'Airbus A321', manufacturer: 'Airbus', maxTakeoffWeight: 93500, wingArea: 122.6, cruiseSpeed: 447, cruiseAltitude: 39100, typicalFlightLevel: 370, category: 'medium' },
  { iata: 'A359', name: 'Airbus A350-900', manufacturer: 'Airbus', maxTakeoffWeight: 280000, wingArea: 443.0, cruiseSpeed: 488, cruiseAltitude: 43100, typicalFlightLevel: 410, category: 'heavy' },
  { iata: 'A388', name: 'Airbus A380-800', manufacturer: 'Airbus', maxTakeoffWeight: 575000, wingArea: 845.0, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 390, category: 'heavy' },
  { iata: 'A20N', name: 'Airbus A320neo', manufacturer: 'Airbus', maxTakeoffWeight: 79000, wingArea: 122.6, cruiseSpeed: 447, cruiseAltitude: 39800, typicalFlightLevel: 380, category: 'medium' },

  // Embraer
  { iata: 'E190', name: 'Embraer E190', manufacturer: 'Embraer', maxTakeoffWeight: 51800, wingArea: 92.5, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 370, category: 'medium' },
  { iata: 'E195', name: 'Embraer E195', manufacturer: 'Embraer', maxTakeoffWeight: 52290, wingArea: 92.5, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 370, category: 'medium' },

  // Bombardier
  { iata: 'CRJ9', name: 'Bombardier CRJ-900', manufacturer: 'Bombardier', maxTakeoffWeight: 38329, wingArea: 76.2, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 370, category: 'medium' },

  // Regional/Small
  { iata: 'DH8D', name: 'Bombardier Dash 8 Q400', manufacturer: 'Bombardier', maxTakeoffWeight: 29257, wingArea: 63.1, cruiseSpeed: 360, cruiseAltitude: 25000, typicalFlightLevel: 250, category: 'light' },
  { iata: 'AT72', name: 'ATR 72-600', manufacturer: 'ATR', maxTakeoffWeight: 23000, wingArea: 61.0, cruiseSpeed: 276, cruiseAltitude: 25000, typicalFlightLevel: 200, category: 'light' },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.aircraft.deleteMany()
  await prisma.airport.deleteMany()

  // Seed airports
  console.log('📍 Seeding airports...')
  for (const airport of airports) {
    await prisma.airport.create({
      data: airport,
    })
  }
  console.log(`✅ Created ${airports.length} airports`)

  // Seed aircraft
  console.log('✈️  Seeding aircraft...')
  for (const plane of aircraft) {
    await prisma.aircraft.create({
      data: plane,
    })
  }
  console.log(`✅ Created ${aircraft.length} aircraft`)

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
