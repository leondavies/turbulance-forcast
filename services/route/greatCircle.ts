import { getDistance, getGreatCircleBearing, computeDestinationPoint } from 'geolib'

export interface Coordinate {
  lat: number
  lon: number
}

export interface RoutePoint extends Coordinate {
  distanceFromOrigin: number // km
  altitude: number // feet
  segmentIndex: number
}

export interface FlightRoute {
  origin: Coordinate
  destination: Coordinate
  waypoints: RoutePoint[]
  totalDistance: number // km
  cruiseAltitude: number // feet
  estimatedDuration: number // minutes
}

/**
 * Calculate the Great Circle route between two airports
 * Uses the haversine formula for shortest path on a sphere
 */
export function calculateGreatCircleRoute(
  origin: Coordinate,
  destination: Coordinate,
  waypointSpacing: number = 50 // km between waypoints
): FlightRoute {
  // Calculate total distance
  const totalDistance = getDistance(
    { latitude: origin.lat, longitude: origin.lon },
    { latitude: destination.lat, longitude: destination.lon }
  ) / 1000 // Convert to km

  // Determine cruise altitude based on distance
  const cruiseAltitude = determineCruiseAltitude(totalDistance)

  // Calculate number of waypoints
  const numWaypoints = Math.ceil(totalDistance / waypointSpacing)

  // Generate waypoints along the great circle
  const waypoints: RoutePoint[] = []

  for (let i = 0; i <= numWaypoints; i++) {
    const fraction = i / numWaypoints
    const distanceFromOrigin = totalDistance * fraction

    // Calculate position along great circle
    const point = interpolateGreatCircle(origin, destination, fraction)

    // Altitude varies: climb to cruise, then descend
    const altitude = calculateAltitudeAtPoint(fraction, cruiseAltitude, totalDistance)

    waypoints.push({
      lat: point.lat,
      lon: point.lon,
      distanceFromOrigin,
      altitude,
      segmentIndex: i,
    })
  }

  // Estimate flight duration (average 800 km/h cruise speed)
  const estimatedDuration = Math.round((totalDistance / 800) * 60)

  return {
    origin,
    destination,
    waypoints,
    totalDistance,
    cruiseAltitude,
    estimatedDuration,
  }
}

/**
 * Interpolate a point along the great circle between two coordinates
 */
function interpolateGreatCircle(
  start: Coordinate,
  end: Coordinate,
  fraction: number
): Coordinate {
  if (fraction === 0) return start
  if (fraction === 1) return end

  // Get the bearing from start to end
  const bearing = getGreatCircleBearing(
    { latitude: start.lat, longitude: start.lon },
    { latitude: end.lat, longitude: end.lon }
  )

  // Get total distance
  const distance = getDistance(
    { latitude: start.lat, longitude: start.lon },
    { latitude: end.lat, longitude: end.lon }
  )

  // Compute destination point at fraction of distance
  const point = computeDestinationPoint(
    { latitude: start.lat, longitude: start.lon },
    distance * fraction,
    bearing
  )

  return {
    lat: point.latitude,
    lon: point.longitude,
  }
}

/**
 * Determine cruise altitude based on flight distance
 */
function determineCruiseAltitude(distanceKm: number): number {
  if (distanceKm < 500) {
    return 25000 // FL250 for short flights
  } else if (distanceKm < 1500) {
    return 33000 // FL330 for medium flights
  } else if (distanceKm < 3000) {
    return 37000 // FL370 for long flights
  } else {
    return 41000 // FL410 for ultra-long flights
  }
}

/**
 * Calculate altitude at a specific point in the flight
 * Models climb, cruise, and descent phases
 */
function calculateAltitudeAtPoint(
  fraction: number,
  cruiseAltitude: number,
  totalDistanceKm: number
): number {
  // Typical climb: 150 km to reach cruise
  // Typical descent: 200 km from cruise to landing
  const climbDistance = Math.min(150, totalDistanceKm * 0.15)
  const descentDistance = Math.min(200, totalDistanceKm * 0.2)

  const climbFraction = climbDistance / totalDistanceKm
  const descentFraction = descentDistance / totalDistanceKm

  if (fraction < climbFraction) {
    // Climbing phase
    const climbProgress = fraction / climbFraction
    return Math.round(5000 + (cruiseAltitude - 5000) * climbProgress)
  } else if (fraction > (1 - descentFraction)) {
    // Descending phase
    const descentProgress = (fraction - (1 - descentFraction)) / descentFraction
    return Math.round(cruiseAltitude - (cruiseAltitude - 2000) * descentProgress)
  } else {
    // Cruise phase
    return cruiseAltitude
  }
}
