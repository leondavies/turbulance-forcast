import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface AirportData {
  id: number
  name: string
  city: string
  country: string
  iata: string
  icao: string
  latitude: number
  longitude: number
  altitude: number
  timezone: string
}

async function main() {
  console.log('🌍 Seeding comprehensive airport database...')

  // Read airports.dat file
  const airportsFile = path.join(process.cwd(), 'airports.dat')
  const data = fs.readFileSync(airportsFile, 'utf-8')
  const lines = data.trim().split('\n')

  const airports: AirportData[] = []

  for (const line of lines) {
    // Parse CSV (with quoted fields)
    const fields = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(f => f.replace(/^"|"$/g, ''))

    if (!fields || fields.length < 14) continue

    const [id, name, city, country, iata, icao, lat, lon, alt, , , timezone] = fields

    // Only include airports with valid IATA codes (3 letters)
    if (!iata || iata === '\\N' || iata.length !== 3) continue
    if (!icao || icao === '\\N') continue

    airports.push({
      id: parseInt(id),
      name: name.trim(),
      city: city.trim(),
      country: country.trim(),
      iata: iata.trim().toUpperCase(),
      icao: icao.trim().toUpperCase(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      altitude: parseInt(alt) || 0,
      timezone: timezone || 'Unknown',
    })
  }

  console.log(`📊 Parsed ${airports.length} airports with valid IATA codes`)

  // Clear existing airports
  console.log('🗑️  Clearing existing airports...')
  await prisma.airport.deleteMany()

  // Insert in batches
  const batchSize = 500
  for (let i = 0; i < airports.length; i += batchSize) {
    const batch = airports.slice(i, i + batchSize)
    await prisma.airport.createMany({
      data: batch.map(a => ({
        iata: a.iata,
        icao: a.icao,
        name: a.name,
        city: a.city,
        country: a.country,
        latitude: a.latitude,
        longitude: a.longitude,
        elevation: a.altitude,
        timezone: a.timezone,
      })),
      skipDuplicates: true,
    })
    console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${i + batch.length}/${airports.length})`)
  }

  console.log('✅ Airport seeding complete!')

  // Show stats
  const total = await prisma.airport.count()
  const sample = await prisma.airport.findMany({ take: 5 })

  console.log(`\n📈 Total airports in database: ${total}`)
  console.log('\n🛫 Sample airports:')
  sample.forEach(a => console.log(`  - ${a.iata} (${a.icao}): ${a.name}, ${a.city}, ${a.country}`))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
    await prisma.$disconnect()
  })
