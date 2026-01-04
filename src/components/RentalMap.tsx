'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Equipment, Rental } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Package, MapPin } from 'lucide-react'

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

const equipmentIcon = createCustomIcon('linear-gradient(135deg, #14b8a6, #0ea5e9)')
const activeRentalIcon = createCustomIcon('linear-gradient(135deg, #22c55e, #16a34a)')
const pendingRentalIcon = createCustomIcon('linear-gradient(135deg, #f59e0b, #d97706)')

interface RentalMapProps {
  rentals: Rental[]
  equipment: Equipment[]
  fullScreen?: boolean
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 10)
  }, [map, center])
  return null
}

export default function RentalMap({ rentals, equipment, fullScreen }: RentalMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.0060]) // Default to NYC

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.log('Geolocation error:', error)
        }
      )
    }
  }, [])

  // Filter items with valid coordinates
  const mappableEquipment = equipment.filter(eq => eq.latitude && eq.longitude)
  const mappableRentals = rentals.filter(r => r.delivery_latitude && r.delivery_longitude)

  return (
    <div className={`relative ${fullScreen ? 'h-full' : 'h-full'} rounded-xl overflow-hidden`}>
      <MapContainer
        center={userLocation}
        zoom={10}
        className="h-full w-full"
        style={{ background: '#111827' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={userLocation} />

        {/* Equipment markers */}
        {mappableEquipment.map((eq) => (
          <Marker
            key={`eq-${eq.id}`}
            position={[eq.latitude!, eq.longitude!]}
            icon={equipmentIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="text-xs text-teal-400 font-medium mb-1">
                  {eq.category?.name || 'Equipment'}
                </div>
                <h3 className="font-semibold text-white mb-1">{eq.name}</h3>
                {eq.brand && <p className="text-sm text-gray-400 mb-2">{eq.brand}</p>}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-white">{formatCurrency(eq.daily_rate)}/day</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    eq.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {eq.available ? 'Available' : 'Rented'}
                  </span>
                </div>
                {eq.available && (
                  <a 
                    href={`/rent/${eq.id}`}
                    className="block w-full py-2 px-3 text-center text-sm font-medium rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90 transition-opacity"
                  >
                    Request Rental
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active rental markers */}
        {mappableRentals.map((rental) => (
          <Marker
            key={`rental-${rental.id}`}
            position={[rental.delivery_latitude!, rental.delivery_longitude!]}
            icon={rental.status === 'active' ? activeRentalIcon : pendingRentalIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className={`text-xs font-medium mb-1 ${
                  rental.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {rental.status === 'active' ? 'Active Rental' : 'Pending Delivery'}
                </div>
                <h3 className="font-semibold text-white mb-1">{rental.equipment?.name || 'Equipment'}</h3>
                <p className="text-sm text-gray-400 mb-2">{rental.delivery_address}</p>
                <div className="text-sm text-gray-400">
                  {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg glass text-sm z-[1000]">
        <div className="font-medium mb-2 text-white">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" />
            <span className="text-gray-300">Available Equipment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600" />
            <span className="text-gray-300">Active Rentals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
            <span className="text-gray-300">Pending Delivery</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 p-3 rounded-lg glass text-sm z-[1000]">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{mappableEquipment.length}</div>
            <div className="text-xs text-gray-400">Equipment</div>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{mappableRentals.length}</div>
            <div className="text-xs text-gray-400">Active Rentals</div>
          </div>
        </div>
      </div>
    </div>
  )
}
