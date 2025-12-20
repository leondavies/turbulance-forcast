'use client'

import React from 'react'
import { getTurbulenceColor } from '@/services/weather/aviationWeather'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
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

  // Calculate center and bounds
  const centerLat = (origin.lat + destination.lat) / 2
  const centerLon = (origin.lon + destination.lon) / 2

  // Calculate distance for zoom level
  const latDiff = Math.abs(origin.lat - destination.lat)
  const lonDiff = Math.abs(origin.lon - destination.lon)
  const maxDiff = Math.max(latDiff, lonDiff)

  // Determine zoom level based on distance
  let zoom = 2
  if (maxDiff < 10) zoom = 5
  else if (maxDiff < 20) zoom = 4
  else if (maxDiff < 40) zoom = 3
  else if (maxDiff < 80) zoom = 2
  else zoom = 1

  // Create separate GeoJSON features for each segment with color based on turbulence
  const segmentFeatures = forecast.slice(0, -1).map((point, i) => {
    const nextPoint = forecast[i + 1]
    return {
      type: 'Feature' as const,
      properties: {
        color: getTurbulenceColor(point.turbulence.level as any),
        level: point.turbulence.level
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [point.lon, point.lat],
          [nextPoint.lon, nextPoint.lat]
        ]
      }
    }
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
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: centerLon,
          latitude: centerLat,
          zoom: zoom
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {/* Route Line */}
        <Source id="route-source" type="geojson" data={routeGeoJSON}>
          <Layer {...routeLayer} />
        </Source>

        {/* Origin Marker */}
        <Marker longitude={origin.lon} latitude={origin.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg font-bold text-xs">
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
            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg font-bold text-xs">
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
