'use client'

import { useEffect, useRef, useState } from 'react'
import Map, { MapRef, Source, Layer, Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getTurbulenceColor } from '@/services/weather/mockTurbulence'

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

// For development without Mapbox token, we'll create a simple SVG map
export function TurbulenceMap({ origin, destination, forecast }: TurbulenceMapProps) {
  const hasMapbox = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!hasMapbox) {
    return <SimpleSVGMap origin={origin} destination={destination} forecast={forecast} />
  }

  return <MapboxMap origin={origin} destination={destination} forecast={forecast} />
}

// Simple SVG-based map for when Mapbox isn't available
function SimpleSVGMap({ origin, destination, forecast }: TurbulenceMapProps) {
  const width = 800
  const height = 500
  const padding = 50

  // Calculate bounds
  const lats = [origin.lat, destination.lat, ...forecast.map(f => f.lat)]
  const lons = [origin.lon, destination.lon, ...forecast.map(f => f.lon)]

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  // Add padding to bounds
  const latPadding = (maxLat - minLat) * 0.2
  const lonPadding = (maxLon - minLon) * 0.2

  // Convert lat/lon to SVG coordinates
  const projectPoint = (lat: number, lon: number) => {
    const x = padding + ((lon - (minLon - lonPadding)) / ((maxLon + lonPadding) - (minLon - lonPadding))) * (width - 2 * padding)
    const y = height - padding - ((lat - (minLat - latPadding)) / ((maxLat + latPadding) - (minLat - latPadding))) * (height - 2 * padding)
    return { x, y }
  }

  const originPoint = projectPoint(origin.lat, origin.lon)
  const destPoint = projectPoint(destination.lat, destination.lon)

  // Create path
  const pathPoints = forecast.map(f => projectPoint(f.lat, f.lon))
  const pathString = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="max-w-full max-h-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Route path with color segments */}
        {pathPoints.map((point, i) => {
          if (i === pathPoints.length - 1) return null
          const nextPoint = pathPoints[i + 1]
          const color = getTurbulenceColor(forecast[i].turbulence.level as any)

          return (
            <line
              key={i}
              x1={point.x}
              y1={point.y}
              x2={nextPoint.x}
              y2={nextPoint.y}
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
            />
          )
        })}

        {/* Origin marker */}
        <g>
          <circle cx={originPoint.x} cy={originPoint.y} r="12" fill="#3b82f6" stroke="white" strokeWidth="3" />
          <text x={originPoint.x} y={originPoint.y - 20} textAnchor="middle" className="text-sm font-bold fill-gray-900">
            {origin.iata}
          </text>
          <text x={originPoint.x} y={originPoint.y - 5} textAnchor="middle" className="text-xs fill-gray-600">
            {origin.city}
          </text>
        </g>

        {/* Destination marker */}
        <g>
          <circle cx={destPoint.x} cy={destPoint.y} r="12" fill="#ef4444" stroke="white" strokeWidth="3" />
          <text x={destPoint.x} y={destPoint.y - 20} textAnchor="middle" className="text-sm font-bold fill-gray-900">
            {destination.iata}
          </text>
          <text x={destPoint.x} y={destPoint.y - 5} textAnchor="middle" className="text-xs fill-gray-600">
            {destination.city}
          </text>
        </g>

        {/* Plane icon at midpoint */}
        {(() => {
          const midIndex = Math.floor(pathPoints.length / 2)
          const midPoint = pathPoints[midIndex]
          return (
            <text x={midPoint.x} y={midPoint.y} textAnchor="middle" className="text-2xl">
              ✈️
            </text>
          )
        })()}
      </svg>

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

// Mapbox-based map (for when token is available)
function MapboxMap({ origin, destination, forecast }: TurbulenceMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState({
    longitude: (origin.lon + destination.lon) / 2,
    latitude: (origin.lat + destination.lat) / 2,
    zoom: 3,
  })

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      const bounds = [
        [Math.min(origin.lon, destination.lon), Math.min(origin.lat, destination.lat)],
        [Math.max(origin.lon, destination.lon), Math.max(origin.lat, destination.lat)],
      ]
      map.fitBounds(bounds as any, { padding: 100, duration: 1000 })
    }
  }, [origin, destination])

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
    >
      <Marker longitude={origin.lon} latitude={origin.lat}>
        <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          {origin.iata}
        </div>
      </Marker>
      <Marker longitude={destination.lon} latitude={destination.lat}>
        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          {destination.iata}
        </div>
      </Marker>
    </Map>
  )
}
