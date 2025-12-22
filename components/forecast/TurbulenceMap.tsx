'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { getTurbulenceColor } from '@/services/weather/aviationWeather'
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

interface TurbulenceMapProps {
  origin: { iata: string; lat: number; lon: number; city: string }
  destination: { iata: string; lat: number; lon: number; city: string }
  forecast: Array<{
    lat: number
    lon: number
    turbulence: {
      level: string
    }
  }>
}

export function TurbulenceMap({ origin, destination, forecast }: TurbulenceMapProps) {
  const mapRef = useRef<MapRef | null>(null)

  const wrapLon = (lon: number) => {
    // Normalize to [-180, 180)
    const x = ((((lon + 180) % 360) + 360) % 360) - 180
    return x
  }

  const unwrapLonNear = (lon: number, referenceLon: number) => {
    // Shift lon by ±360 so it's as close as possible to referenceLon
    let x = wrapLon(lon)
    const ref = wrapLon(referenceLon)
    const delta = x - ref
    if (delta > 180) x -= 360
    if (delta < -180) x += 360
    return x
  }

  const shortestLonDiff = (a: number, b: number) => {
    const d = Math.abs(wrapLon(b) - wrapLon(a))
    return Math.min(d, 360 - d)
  }

  const splitSegmentAtAntimeridian = (
    a: [number, number],
    b: [number, number]
  ): Array<[[number, number], [number, number]]> => {
    const [lon1, lat1] = a
    const [lon2, lat2] = b

    // Work in wrapped space for detection
    const x1 = wrapLon(lon1)
    const x2 = wrapLon(lon2)
    const delta = x2 - x1

    // Normal case: doesn't cross the antimeridian
    if (Math.abs(delta) <= 180) {
      return [[[x1, lat1], [x2, lat2]]]
    }

    // Crosses the antimeridian: split into two segments at ±180
    const crossesEastward = x1 > 0 && x2 < 0
    const crossingLon = crossesEastward ? 180 : -180

    // Adjust the second longitude into a continuous space to interpolate correctly
    const x2Adjusted = crossesEastward ? x2 + 360 : x2 - 360
    const t = (crossingLon - x1) / (x2Adjusted - x1)
    const latCross = lat1 + t * (lat2 - lat1)

    const otherSideLon = crossingLon === 180 ? -180 : 180

    return [
      [[x1, lat1], [crossingLon, latCross]],
      [[otherSideLon, latCross], [x2, lat2]],
    ]
  }

  const routeBounds = useMemo(() => {
    // Prefer forecast waypoints (better representation of the drawn polyline),
    // but fall back to origin/destination if forecast isn't available yet.
    const pts = forecast?.length
      ? forecast.map((p) => ({ lat: p.lat, lon: p.lon }))
      : [
          { lat: origin.lat, lon: origin.lon },
          { lat: destination.lat, lon: destination.lon },
        ]

    if (pts.length < 2) return null

    // Unwrap lons to a continuous sequence (avoids dateline bounds being "the long way around")
    const unwrapped: number[] = []
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) unwrapped.push(wrapLon(pts[i].lon))
      else unwrapped.push(unwrapLonNear(pts[i].lon, unwrapped[i - 1]))
    }

    let west = Math.min(...unwrapped)
    let east = Math.max(...unwrapped)
    const center = (west + east) / 2

    // Shift to keep the center in [-180, 180) so Mapbox viewport behaves predictably
    let shift = 0
    if (center < -180) shift = 360
    if (center >= 180) shift = -360
    west += shift
    east += shift

    const lats = pts.map((p) => p.lat)
    const south = Math.min(...lats)
    const north = Math.max(...lats)

    return { west, east, south, north }
  }, [forecast, origin.lat, origin.lon, destination.lat, destination.lon])

  // Center the initial view roughly between origin & destination; fitBounds will refine this.
  const originLonWrapped = wrapLon(origin.lon)
  const destLonUnwrapped = unwrapLonNear(destination.lon, originLonWrapped)
  const centerLon = wrapLon((originLonWrapped + destLonUnwrapped) / 2)
  const centerLat = (origin.lat + destination.lat) / 2

  // Calculate distance for zoom level
  const latDiff = Math.abs(origin.lat - destination.lat)
  const lonDiff = shortestLonDiff(origin.lon, destination.lon)
  const maxDiff = Math.max(latDiff, lonDiff)

  // Determine zoom level based on distance
  let zoom = 2
  if (maxDiff < 10) zoom = 5
  else if (maxDiff < 20) zoom = 4
  else if (maxDiff < 40) zoom = 3
  else if (maxDiff < 80) zoom = 2
  else zoom = 1

  const fitToRoute = () => {
    const map = mapRef.current
    if (!map || !routeBounds) return

    // Ensure the map has measured its container
    map.resize()
    map.fitBounds(
      [
        [routeBounds.west, routeBounds.south],
        [routeBounds.east, routeBounds.north],
      ],
      {
        padding: 80,
        duration: 700,
      }
    )
  }

  // Fit when forecast/route loads or changes.
  useEffect(() => {
    if (!routeBounds) return
    fitToRoute()
    // Fit again shortly after (helps when map becomes visible after scroll / layout settles)
    const t = window.setTimeout(() => fitToRoute(), 150)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeBounds])

  // Create separate GeoJSON features for each segment, splitting at the antimeridian
  // to avoid the "wrap-around ring" on long-haul routes (e.g. crossing ±180° longitude).
  const segmentFeatures = forecast.slice(0, -1).flatMap((point, i) => {
    const nextPoint = forecast[i + 1]
    const color = getTurbulenceColor(point.turbulence.level as any)

    const pieces = splitSegmentAtAntimeridian(
      [point.lon, point.lat],
      [nextPoint.lon, nextPoint.lat]
    )

    return pieces.map((coords) => ({
      type: 'Feature' as const,
      properties: {
        color,
        level: point.turbulence.level,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: coords,
      },
    }))
  })

  const routeGeoJSON = {
    type: 'FeatureCollection' as const,
    features: segmentFeatures
  }

  // Layer style for route with color from properties
  const routeLayer = {
    id: 'route',
    type: 'line' as const,
    paint: {
      'line-color': ['get', 'color'] as any,
      'line-width': 4,
      'line-opacity': 0.9
    }
  }

  // Use public Mapbox token (you should add your own in production)
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={() => {
          fitToRoute()
        }}
        initialViewState={{
          longitude: centerLon,
          latitude: centerLat,
          zoom,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        // Prevent duplicated world copies that can make long-haul routes look like a "ring"
        renderWorldCopies={false}
      >
        {/* Route Line */}
        <Source id="route-source" type="geojson" data={routeGeoJSON}>
          <Layer {...routeLayer} />
        </Source>

        {/* Origin Marker */}
        <Marker longitude={origin.lon} latitude={origin.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="bg-brand-blue text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg font-bold text-xs">
              {origin.iata}
            </div>
            <div className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded shadow mt-1">
              {origin.city}
            </div>
          </div>
        </Marker>

        {/* Destination Marker */}
        <Marker longitude={destination.lon} latitude={destination.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="bg-brand-orange text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg font-bold text-xs">
              {destination.iata}
            </div>
            <div className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded shadow mt-1">
              {destination.city}
            </div>
          </div>
        </Marker>
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="text-sm font-semibold text-gray-900 mb-2">Turbulence Level</div>
        <div className="space-y-1">
          {[
            { level: 'Smooth', color: getTurbulenceColor('smooth') },
            { level: 'Light', color: getTurbulenceColor('light') },
            { level: 'Moderate', color: getTurbulenceColor('moderate') },
            { level: 'Severe', color: getTurbulenceColor('severe') },
          ].map((item) => (
            <div key={item.level} className="flex items-center gap-2">
              <div className="w-6 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-700">{item.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
