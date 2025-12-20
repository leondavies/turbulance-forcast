import 'dotenv/config'
import { prisma } from '../lib/db'

const commonAircraft = [
  // Boeing
  { iata: '737', name: 'Boeing 737', manufacturer: 'Boeing', maxTakeoffWeight: 70000, cruiseSpeed: 447, cruiseAltitude: 35000, typicalFlightLevel: 350, category: 'medium' },
  { iata: '738', name: 'Boeing 737-800', manufacturer: 'Boeing', maxTakeoffWeight: 79000, cruiseSpeed: 453, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'medium' },
  { iata: '739', name: 'Boeing 737-900', manufacturer: 'Boeing', maxTakeoffWeight: 85000, cruiseSpeed: 453, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'medium' },
  { iata: '73J', name: 'Boeing 737-900', manufacturer: 'Boeing', maxTakeoffWeight: 85000, cruiseSpeed: 453, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'medium' },
  { iata: '7M8', name: 'Boeing 737 MAX 8', manufacturer: 'Boeing', maxTakeoffWeight: 82190, cruiseSpeed: 453, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'medium' },
  { iata: '7M9', name: 'Boeing 737 MAX 9', manufacturer: 'Boeing', maxTakeoffWeight: 88300, cruiseSpeed: 453, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'medium' },
  { iata: '77W', name: 'Boeing 777-300ER', manufacturer: 'Boeing', maxTakeoffWeight: 351534, cruiseSpeed: 490, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '777', name: 'Boeing 777', manufacturer: 'Boeing', maxTakeoffWeight: 351534, cruiseSpeed: 490, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '787', name: 'Boeing 787 Dreamliner', manufacturer: 'Boeing', maxTakeoffWeight: 228000, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '788', name: 'Boeing 787-8', manufacturer: 'Boeing', maxTakeoffWeight: 228000, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '789', name: 'Boeing 787-9', manufacturer: 'Boeing', maxTakeoffWeight: 254000, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '78J', name: 'Boeing 787-10', manufacturer: 'Boeing', maxTakeoffWeight: 254000, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '747', name: 'Boeing 747', manufacturer: 'Boeing', maxTakeoffWeight: 412775, cruiseSpeed: 490, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '74H', name: 'Boeing 747-8', manufacturer: 'Boeing', maxTakeoffWeight: 447700, cruiseSpeed: 490, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },
  { iata: '757', name: 'Boeing 757', manufacturer: 'Boeing', maxTakeoffWeight: 123600, cruiseSpeed: 459, cruiseAltitude: 42000, typicalFlightLevel: 420, category: 'medium' },
  { iata: '767', name: 'Boeing 767', manufacturer: 'Boeing', maxTakeoffWeight: 186880, cruiseSpeed: 470, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },

  // Airbus
  { iata: 'A20N', name: 'Airbus A320neo', manufacturer: 'Airbus', maxTakeoffWeight: 79000, cruiseSpeed: 447, cruiseAltitude: 39800, typicalFlightLevel: 398, category: 'medium' },
  { iata: 'A21N', name: 'Airbus A321neo', manufacturer: 'Airbus', maxTakeoffWeight: 97000, cruiseSpeed: 447, cruiseAltitude: 39800, typicalFlightLevel: 398, category: 'medium' },
  { iata: 'A320', name: 'Airbus A320', manufacturer: 'Airbus', maxTakeoffWeight: 78000, cruiseSpeed: 447, cruiseAltitude: 39000, typicalFlightLevel: 390, category: 'medium' },
  { iata: 'A321', name: 'Airbus A321', manufacturer: 'Airbus', maxTakeoffWeight: 93500, cruiseSpeed: 447, cruiseAltitude: 39000, typicalFlightLevel: 390, category: 'medium' },
  { iata: 'A319', name: 'Airbus A319', manufacturer: 'Airbus', maxTakeoffWeight: 75500, cruiseSpeed: 447, cruiseAltitude: 39000, typicalFlightLevel: 390, category: 'medium' },
  { iata: 'A318', name: 'Airbus A318', manufacturer: 'Airbus', maxTakeoffWeight: 68000, cruiseSpeed: 447, cruiseAltitude: 39000, typicalFlightLevel: 390, category: 'medium' },
  { iata: 'A330', name: 'Airbus A330', manufacturer: 'Airbus', maxTakeoffWeight: 242000, cruiseSpeed: 470, cruiseAltitude: 41450, typicalFlightLevel: 414, category: 'heavy' },
  { iata: 'A332', name: 'Airbus A330-200', manufacturer: 'Airbus', maxTakeoffWeight: 242000, cruiseSpeed: 470, cruiseAltitude: 41450, typicalFlightLevel: 414, category: 'heavy' },
  { iata: 'A333', name: 'Airbus A330-300', manufacturer: 'Airbus', maxTakeoffWeight: 242000, cruiseSpeed: 470, cruiseAltitude: 41450, typicalFlightLevel: 414, category: 'heavy' },
  { iata: 'A339', name: 'Airbus A330-900neo', manufacturer: 'Airbus', maxTakeoffWeight: 251000, cruiseSpeed: 470, cruiseAltitude: 41450, typicalFlightLevel: 414, category: 'heavy' },
  { iata: 'A350', name: 'Airbus A350', manufacturer: 'Airbus', maxTakeoffWeight: 280000, cruiseSpeed: 488, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },
  { iata: 'A359', name: 'Airbus A350-900', manufacturer: 'Airbus', maxTakeoffWeight: 280000, cruiseSpeed: 488, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },
  { iata: 'A35K', name: 'Airbus A350-1000', manufacturer: 'Airbus', maxTakeoffWeight: 308000, cruiseSpeed: 488, cruiseAltitude: 43100, typicalFlightLevel: 430, category: 'heavy' },
  { iata: 'A380', name: 'Airbus A380', manufacturer: 'Airbus', maxTakeoffWeight: 560000, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 430, category: 'heavy' },
  { iata: 'A388', name: 'Airbus A380-800', manufacturer: 'Airbus', maxTakeoffWeight: 560000, cruiseSpeed: 488, cruiseAltitude: 43000, typicalFlightLevel: 430, category: 'heavy' },

  // Regional Jets
  { iata: 'E75L', name: 'Embraer E175', manufacturer: 'Embraer', maxTakeoffWeight: 38600, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'light' },
  { iata: 'E75S', name: 'Embraer E175', manufacturer: 'Embraer', maxTakeoffWeight: 38600, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'light' },
  { iata: 'E170', name: 'Embraer E170', manufacturer: 'Embraer', maxTakeoffWeight: 37200, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'light' },
  { iata: 'E190', name: 'Embraer E190', manufacturer: 'Embraer', maxTakeoffWeight: 51800, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'medium' },
  { iata: 'E195', name: 'Embraer E195', manufacturer: 'Embraer', maxTakeoffWeight: 52290, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'medium' },
  { iata: 'CRJ9', name: 'Bombardier CRJ-900', manufacturer: 'Bombardier', maxTakeoffWeight: 38330, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'light' },
  { iata: 'CRJ7', name: 'Bombardier CRJ-700', manufacturer: 'Bombardier', maxTakeoffWeight: 34019, cruiseSpeed: 447, cruiseAltitude: 41000, typicalFlightLevel: 410, category: 'light' },
  { iata: 'DH8D', name: 'Bombardier Dash 8-Q400', manufacturer: 'Bombardier', maxTakeoffWeight: 29257, cruiseSpeed: 360, cruiseAltitude: 25000, typicalFlightLevel: 250, category: 'light' },
]

async function main() {
  console.log('Seeding aircraft data...')

  // Check if we already have data
  const count = await prisma.aircraft.count()
  console.log(`Current aircraft count: ${count}`)

  if (count > 0) {
    console.log('Aircraft data already exists. Updating...')
  }

  // Upsert all aircraft
  for (const aircraft of commonAircraft) {
    await prisma.aircraft.upsert({
      where: { iata: aircraft.iata },
      update: aircraft,
      create: aircraft,
    })
  }

  console.log(`✓ Seeded ${commonAircraft.length} aircraft types`)

  const finalCount = await prisma.aircraft.count()
  console.log(`Final aircraft count: ${finalCount}`)
}

main()
  .catch((e) => {
    console.error('Error seeding aircraft:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
