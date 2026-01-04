'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Icon, LatLng } from 'leaflet'
import { Navigation, Loader2 } from 'lucide-react'

interface LocationPickerProps {
  onLocationChange: (lat: number, lng: number) => void
  initialLat?: number | null
  initialLng?: number | null
}

// Custom marker icon
const markerIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#14b8a6" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  
  return null
}

export default function LocationPicker({ onLocationChange, initialLat, initialLng }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [gettingLocation, setGettingLocation] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 20.5937, // Default to India center
    lng: initialLng || 78.9629,
  })

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng })
    onLocationChange(lat, lng)
  }, [onLocationChange])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition({ lat: latitude, lng: longitude })
        setMapCenter({ lat: latitude, lng: longitude })
        onLocationChange(latitude, longitude)
        setGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please click on the map to set location.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3">
      {/* Use current location button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={gettingLocation}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30 transition-colors disabled:opacity-50"
      >
        {gettingLocation ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        {gettingLocation ? 'Getting location...' : 'Use my current location'}
      </button>

      {/* Map */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-700">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={position ? 15 : 5}
          className="w-full h-full"
          style={{ background: '#1f2937' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          
          {position && (
            <>
              <Marker position={[position.lat, position.lng]} icon={markerIcon} />
              <RecenterMap lat={position.lat} lng={position.lng} />
            </>
          )}
        </MapContainer>

        {/* Instruction overlay */}
        {!position && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <p className="text-sm text-white bg-black/50 px-3 py-1.5 rounded-lg">
              Click on the map to set location
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
