'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Calendar, MapPin, Package, DollarSign, CheckCircle } from 'lucide-react'
import { Equipment } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getDaysBetween, calculateRentalCost, getConditionLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamic import for LocationPicker to avoid SSR issues
const LocationPicker = dynamic(() => import('./LocationPicker'), { 
  ssr: false,
  loading: () => (
    <div className="h-[250px] bg-gray-800 rounded-xl flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  )
})

interface RentalRequestModalProps {
  isOpen: boolean
  onClose: () => void
  equipment: Equipment | null
}

export default function RentalRequestModal({ isOpen, onClose, equipment }: RentalRequestModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    delivery_address: '',
    delivery_latitude: null as number | null,
    delivery_longitude: null as number | null,
    notes: '',
  })

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      delivery_latitude: lat,
      delivery_longitude: lng
    }))
  }

  const days = formData.start_date && formData.end_date 
    ? getDaysBetween(formData.start_date, formData.end_date)
    : 0

  const totalCost = equipment && days > 0
    ? calculateRentalCost(
        equipment.daily_rate,
        equipment.weekly_rate,
        equipment.monthly_rate,
        days
      )
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipment) return
    
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      if (user.id === equipment.seller_id) {
        setError('You cannot rent your own equipment')
        setLoading(false)
        return
      }

      // Validate delivery location is set
      if (!formData.delivery_latitude || !formData.delivery_longitude) {
        setError('Please pin your delivery location on the map')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('rentals')
        .insert({
          equipment_id: equipment.id,
          buyer_id: user.id,
          seller_id: equipment.seller_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_amount: totalCost,
          delivery_address: formData.delivery_address,
          delivery_latitude: formData.delivery_latitude,
          delivery_longitude: formData.delivery_longitude,
          notes: formData.notes || null,
          status: 'pending',
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        setFormData({
          start_date: '',
          end_date: '',
          delivery_address: '',
          delivery_latitude: null,
          delivery_longitude: null,
          notes: '',
        })
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit request'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !equipment) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
        >
          {success ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
              <p className="text-gray-400">The equipment owner will review your request and respond shortly.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold">Request Rental</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Equipment summary */}
              <div className="p-6 bg-gray-800/50 border-b border-gray-800">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    {equipment.category && (
                      <div className="text-xs text-teal-400 font-medium mb-1">{equipment.category.name}</div>
                    )}
                    <h3 className="font-semibold mb-1">{equipment.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        equipment.condition === 'new' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {getConditionLabel(equipment.condition)}
                      </span>
                      {equipment.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {equipment.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing info */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <div className="text-lg font-bold text-white">{formatCurrency(equipment.daily_rate)}</div>
                    <div className="text-xs text-gray-400">/day</div>
                  </div>
                  {equipment.weekly_rate && (
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-white">{formatCurrency(equipment.weekly_rate)}</div>
                      <div className="text-xs text-gray-400">/week</div>
                    </div>
                  )}
                  {equipment.monthly_rate && (
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-white">{formatCurrency(equipment.monthly_rate)}</div>
                      <div className="text-xs text-gray-400">/month</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-24">
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Location */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pin Delivery Location on Map *
                  </label>
                  <LocationPicker
                    onLocationChange={handleLocationChange}
                    initialLat={formData.delivery_latitude || undefined}
                    initialLng={formData.delivery_longitude || undefined}
                  />
                  {formData.delivery_latitude && formData.delivery_longitude && (
                    <p className="text-xs text-teal-400 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Location pinned: {formData.delivery_latitude.toFixed(4)}, {formData.delivery_longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Delivery address (text) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Address Details</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                      placeholder="Building name, floor, room number, etc..."
                      rows={2}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requirements or questions..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none resize-none"
                  />
                </div>

                {/* Cost summary */}
                {days > 0 && (
                  <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Duration</span>
                      <span className="font-medium">{days} day{days !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Estimated Total</span>
                      <span className="text-2xl font-bold text-teal-400">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                )}

                {/* Submit - sticky footer */}
                <div className="pointer-events-none">
                  <div className="fixed inset-x-0 bottom-0 flex justify-center px-6 pb-6">
                    <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900/90 backdrop-blur p-4 shadow-2xl pointer-events-auto">
                      <div className="flex flex-col gap-1 text-xs text-gray-400 mb-3">
                        <span>Select start/end dates and pin the delivery location to enable the button.</span>
                        {(!formData.delivery_latitude || !formData.delivery_longitude) && (
                          <span className="text-amber-400">Delivery location is required.</span>
                        )}
                        {days === 0 && <span className="text-amber-400">Pick both dates to continue.</span>}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 py-3 rounded-xl border border-gray-700 font-medium hover:bg-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || days === 0 || !formData.delivery_latitude || !formData.delivery_longitude}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Request'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
