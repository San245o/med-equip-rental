'use client'

import { Equipment } from '@/types'
import { formatCurrency, getConditionLabel } from '@/lib/utils'
import { MapPin, Package, Edit, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface EquipmentCardProps {
  equipment: Equipment
  onClick?: () => void
  isOwner?: boolean
}

export default function EquipmentCard({ equipment, onClick, isOwner }: EquipmentCardProps) {
  const listingType = equipment.listing_type || 'rent'
  const detailHref = listingType === 'sell' ? `/rent/${equipment.id}?mode=buy` : `/rent/${equipment.id}`

  const cardContent = (
    <>
      {/* Image */}
      <div className="relative h-40 bg-[#0a0a0a]">
        {equipment.images && equipment.images.length > 0 ? (
          <img
            src={equipment.images[0]}
            alt={equipment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center dot-pattern">
            <Package className="w-12 h-12 text-[#333]" />
          </div>
        )}
        
        {/* Status badge */}
        <div className={`absolute top-3 right-3 font-mono text-xs px-2 py-0.5 rounded-md ${
          equipment.available 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {equipment.available ? 'Available' : 'Rented'}
        </div>
        <div className="absolute top-3 left-3 font-mono text-[10px] px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 uppercase tracking-wider">
          {listingType === 'both' ? 'Rent + Sell' : listingType === 'sell' ? 'For Sale' : 'For Rent'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {equipment.category && (
          <p className="text-xs text-[#737373] uppercase tracking-wider mb-1">
            {equipment.category.name}
          </p>
        )}

        {/* Name */}
        <h3 className="font-medium text-sm mb-1 truncate group-hover:text-emerald-400 transition-colors">
          {equipment.name}
        </h3>

        {/* Brand & Model */}
        {(equipment.brand || equipment.model) && (
          <p className="text-xs text-[#525252] mb-2 truncate">
            {[equipment.brand, equipment.model].filter(Boolean).join(' ')}
          </p>
        )}

        {/* Location & Condition */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            equipment.condition === 'new' 
              ? 'bg-emerald-500/10 text-emerald-400'
              : equipment.condition === 'excellent'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-[#262626] text-[#737373]'
          }`}>
            {getConditionLabel(equipment.condition)}
          </span>
          {equipment.city && (
            <span className="text-xs text-[#525252] flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {equipment.city}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-4 space-y-1">
          {listingType !== 'sell' && (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-mono font-semibold">{formatCurrency(equipment.daily_rate)}</span>
              <span className="text-xs text-[#525252]">/day</span>
            </div>
          )}
          {listingType !== 'rent' && equipment.sale_price && (
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-mono text-cyan-300">Buy: {formatCurrency(equipment.sale_price)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isOwner ? (
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg bg-[#1c1c1c] text-[#a1a1a1] hover:bg-[#262626] hover:text-white text-sm transition-all duration-200 flex items-center justify-center gap-2">
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : equipment.available ? (
          <div className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium text-sm text-center transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]">
            {listingType === 'both' ? 'Buy or Rent' : listingType === 'sell' ? 'Buy Now' : 'Request Rental'}
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-full py-2 rounded-lg bg-[#1c1c1c] text-[#525252] font-medium text-sm text-center">
            Not Available
          </div>
        )}
      </div>
    </>
  )

  if (isOwner || !equipment.available) {
    return (
      <div className="group bg-[#141414] rounded-xl border border-[#262626] overflow-hidden transition-all duration-200 hover:border-[#333]">
        {cardContent}
      </div>
    )
  }

  return (
    <Link
      href={detailHref}
      className="group block bg-[#141414] rounded-xl border border-[#262626] overflow-hidden transition-all duration-200 hover:border-[#333] card-hover"
    >
      {cardContent}
    </Link>
  )
}
