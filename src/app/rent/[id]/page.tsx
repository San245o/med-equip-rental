'use client'

import { useState, useEffect, use } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, Loader2, Package, CheckCircle, AlertCircle, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getDaysBetween, calculateRentalCost, getConditionLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import for LocationPicker to avoid SSR issues
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { 
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-[#0a0a0a] rounded-lg border border-[#262626] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#525252]" />
    </div>
  )
})

interface EquipmentWithSeller {
  id: number
  seller_id: string
  category_id?: number
  name: string
  description?: string
  brand?: string
  model?: string
  year_manufactured?: number
  condition: 'new' | 'excellent' | 'good' | 'fair'
  daily_rate: number
  weekly_rate?: number
  monthly_rate?: number
  images: string[]
  specifications: Record<string, string>
  latitude?: number
  longitude?: number
  city?: string
  available: boolean
  featured: boolean
  views_count: number
  created_at: string
  updated_at: string
  seller?: {
    id: string
    full_name: string
    hospital_name?: string
    city?: string
  }
  category?: {
    name: string
  }
}

export default function RentEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [equipment, setEquipment] = useState<EquipmentWithSeller | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    delivery_address: '',
    delivery_latitude: null as number | null,
    delivery_longitude: null as number | null,
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirectTo=/rent/' + resolvedParams.id)
        return
      }
      setCurrentUser(user)

      // Get equipment details
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          *,
          category:categories(name),
          seller:profiles!equipment_seller_id_fkey(id, full_name, hospital_name, city)
        `)
        .eq('id', resolvedParams.id)
        .single()

      if (equipmentError || !equipmentData) {
        setError('Equipment not found')
        setLoading(false)
        return
      }

      setEquipment(equipmentData)
      setLoading(false)
    }

    fetchData()
  }, [resolvedParams.id, router])

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
    if (!equipment || !currentUser) return
    
    setSubmitting(true)
    setError(null)

    try {
      // Validation
      if (currentUser.id === equipment.seller_id) {
        setError('You cannot rent your own equipment')
        setSubmitting(false)
        return
      }

      if (!formData.delivery_latitude || !formData.delivery_longitude) {
        setError('Please pin your delivery location on the map')
        setSubmitting(false)
        return
      }

      if (days <= 0) {
        setError('Please select valid rental dates')
        setSubmitting(false)
        return
      }

      const supabase = createClient()

      // Ensure profile exists for the buyer
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data: { user } } = await supabase.auth.getUser()
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
            role: 'both'
          })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError('Failed to create user profile: ' + profileError.message)
          setSubmitting(false)
          return
        }
      }

      // Insert rental request
      const { data: rentalData, error: insertError } = await supabase
        .from('rentals')
        .insert({
          equipment_id: Number(equipment.id),
          buyer_id: currentUser.id,
          seller_id: equipment.seller_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_amount: totalCost,
          delivery_address: formData.delivery_address || null,
          delivery_latitude: formData.delivery_latitude,
          delivery_longitude: formData.delivery_longitude,
          notes: formData.notes || null,
          status: 'pending',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Rental insert error:', insertError)
        setError('Failed to submit request: ' + insertError.message)
        setSubmitting(false)
        return
      }

      console.log('Rental created successfully:', rentalData)
      setSuccess(true)
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: unknown) {
      console.error('Unexpected error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit request'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h1 className="text-xl font-semibold">Equipment Not Found</h1>
        <Link 
          href="/dashboard"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
        >
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </motion.div>
        <h1 className="text-xl font-semibold">Request Submitted</h1>
        <p className="text-sm text-[#737373]">The seller will review your request shortly.</p>
        <p className="text-xs text-[#525252]">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1c1c1c]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 hover:bg-[#1c1c1c] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-medium">Request Rental</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Equipment Info - Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
              {/* Equipment Image */}
              {equipment.images && equipment.images.length > 0 ? (
                <img 
                  src={equipment.images[0]} 
                  alt={equipment.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-[#0a0a0a] dot-pattern flex items-center justify-center">
                  <Package className="w-12 h-12 text-[#333]" />
                </div>
              )}

              <div className="p-4">
                {equipment.category && (
                  <p className="text-xs text-[#737373] uppercase tracking-wider">{equipment.category.name}</p>
                )}
                <h2 className="text-lg font-semibold mt-1">{equipment.name}</h2>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
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

                {/* Seller Info */}
                {equipment.seller && (
                  <div className="mt-4 p-3 bg-[#0a0a0a] rounded-lg border border-[#1c1c1c]">
                    <p className="text-xs text-[#525252] mb-1">Listed by</p>
                    <p className="text-sm font-medium">{equipment.seller.full_name}</p>
                    {equipment.seller.hospital_name && (
                      <p className="text-xs text-[#737373] flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {equipment.seller.hospital_name}
                      </p>
                    )}
                  </div>
                )}

                {/* Pricing */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#1c1c1c]">
                    <div className="text-lg font-mono font-semibold text-emerald-400">{formatCurrency(equipment.daily_rate)}</div>
                    <div className="text-xs text-[#525252]">/day</div>
                  </div>
                  {equipment.weekly_rate && (
                    <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#1c1c1c]">
                      <div className="text-lg font-mono font-semibold">{formatCurrency(equipment.weekly_rate)}</div>
                      <div className="text-xs text-[#525252]">/week</div>
                    </div>
                  )}
                  {equipment.monthly_rate && (
                    <div className="p-2 bg-[#0a0a0a] rounded-lg border border-[#1c1c1c]">
                      <div className="text-lg font-mono font-semibold">{formatCurrency(equipment.monthly_rate)}</div>
                      <div className="text-xs text-[#525252]">/month</div>
                    </div>
                  )}
                </div>

                {/* Cost Summary */}
                {days > 0 && (
                  <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-[#737373]">Duration</span>
                      <span className="font-mono">{days} day{days !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373] text-sm">Estimated Total</span>
                      <span className="text-xl font-mono font-semibold text-emerald-400">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Rental Period */}
              <div className="bg-[#141414] rounded-lg border border-[#262626] p-6">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Rental Period
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none transition-colors font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none transition-colors font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Location */}
              <div className="bg-[#141414] rounded-lg border border-[#262626] p-6">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Delivery Location
                </h3>
                
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Pin your location on the map *
                  </label>
                  <LocationPicker
                    onLocationChange={handleLocationChange}
                    initialLat={formData.delivery_latitude || undefined}
                    initialLng={formData.delivery_longitude || undefined}
                  />
                  {formData.delivery_latitude && formData.delivery_longitude && (
                    <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Location pinned: {formData.delivery_latitude.toFixed(4)}, {formData.delivery_longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Address Details (optional)
                  </label>
                  <textarea
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    placeholder="Building name, floor, room number, landmarks..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none resize-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div className="bg-[#141414] rounded-lg border border-[#262626] p-6">
                <h3 className="text-sm font-medium text-gray-300 mb-4 uppercase tracking-wide">Additional Notes</h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requirements, questions for the seller..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none resize-none transition-colors text-sm"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 rounded-lg border border-[#262626] font-medium text-center text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors text-sm"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || days === 0 || !formData.delivery_latitude}
                  className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Rental Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
