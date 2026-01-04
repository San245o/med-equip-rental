'use client'

import { Rental } from '@/types'
import { formatCurrency, formatDateRange, getStatusColor } from '@/lib/utils'
import { Package, Calendar, MapPin, CheckCircle2, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface RentalCardProps {
  rental: Rental
  viewType: 'buyer' | 'seller'
}

export default function RentalCard({ rental, viewType }: RentalCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled') => {
    setLoading(newStatus)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('rentals')
      .update({ status: newStatus })
      .eq('id', rental.id)

    if (!error) {
      router.refresh()
    }
    setLoading(null)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      completed: 'bg-[#262626] text-[#737373] border-[#333]',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return styles[status] || styles.pending
  }

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden hover:border-[#333] transition-colors">
      {/* Header with status */}
      <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#525252]" />
          <span className="text-sm font-medium truncate">{rental.equipment?.name || 'Equipment'}</span>
        </div>
        <span className={`font-mono text-xs px-2 py-0.5 rounded-md border ${getStatusBadge(rental.status)}`}>
          {rental.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Party info */}
        <div className="text-xs text-[#737373]">
          {viewType === 'buyer' ? (
            <>From: <span className="text-[#a1a1a1]">{rental.seller?.hospital_name || rental.seller?.full_name}</span></>
          ) : (
            <>By: <span className="text-[#a1a1a1]">{rental.buyer?.hospital_name || rental.buyer?.full_name}</span></>
          )}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-3.5 h-3.5 text-[#525252]" />
          <span className="text-[#a1a1a1]">{formatDateRange(rental.start_date, rental.end_date)}</span>
        </div>

        {/* Location */}
        {rental.delivery_address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-3.5 h-3.5 text-[#525252]" />
            <span className="text-[#737373] truncate">{rental.delivery_address}</span>
          </div>
        )}

        {/* Amount */}
        <div className="pt-2 border-t border-[#262626]">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-semibold">{formatCurrency(rental.total_amount)}</span>
            <span className="text-xs text-[#525252]">total</span>
          </div>
        </div>

        {/* Notes */}
        {rental.notes && (
          <p className="text-xs text-[#737373] p-2 bg-[#0a0a0a] rounded-lg border border-[#1c1c1c]">
            {rental.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-[#262626] flex flex-wrap gap-2">
        {viewType === 'seller' && rental.status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusUpdate('approved')}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'approved' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate('rejected')}
              disabled={loading !== null}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            </button>
          </>
        )}

        {viewType === 'seller' && rental.status === 'approved' && (
          <button
            onClick={() => handleStatusUpdate('active')}
            disabled={loading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg border border-blue-500/20 transition-colors disabled:opacity-50"
          >
            {loading === 'active' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Mark Delivered
          </button>
        )}

        {rental.status === 'active' && (
          <button
            onClick={() => handleStatusUpdate('completed')}
            disabled={loading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm rounded-lg border border-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {loading === 'completed' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Complete
          </button>
        )}

        {viewType === 'buyer' && rental.status === 'pending' && (
          <button
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={loading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1c1c1c] hover:bg-[#262626] text-[#a1a1a1] text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading === 'cancelled' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Cancel
          </button>
        )}

        {(rental.status === 'completed' || rental.status === 'cancelled' || rental.status === 'rejected') && (
          <div className="flex-1 text-center text-xs text-[#525252] py-2">
            {rental.status === 'completed' ? 'Rental completed' : rental.status === 'cancelled' ? 'Cancelled' : 'Rejected'}
          </div>
        )}
      </div>
    </div>
  )
}