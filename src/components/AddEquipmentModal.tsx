'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, MapPin, Plus, Trash2, Clipboard } from 'lucide-react'
import { Category } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { uploadMultipleImages } from '@/lib/upload'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import the map picker to avoid SSR issues
const LocationPicker = dynamic(() => import('./LocationPicker'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-xl bg-gray-800 animate-pulse flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
    </div>
  )
})

interface AddEquipmentModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

export default function AddEquipmentModal({ isOpen, onClose, categories }: AddEquipmentModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    brand: '',
    year_manufactured: '',
    condition: 'good',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const addImage = useCallback((file: File) => {
    if (images.length >= 5) {
      setError('Maximum 5 images allowed')
      return
    }
    
    setImages(prev => [...prev, file])
    setImagePreview(prev => [...prev, URL.createObjectURL(file)])
  }, [images.length])

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isOpen) return
      
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            addImage(file)
          }
          break
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen, addImage])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    files.forEach(file => addImage(file))
    if (e.target) e.target.value = ''
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }
    
    files.forEach(file => addImage(file))
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    URL.revokeObjectURL(imagePreview[index])
    setImagePreview(imagePreview.filter((_, i) => i !== index))
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // Check if user profile exists, create if not
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.email?.split('@')[0] || 'User',
            role: 'both',
          })
        
        if (createProfileError) {
          console.error('Profile creation error:', createProfileError)
          setError('Failed to create user profile. Please try again.')
          setLoading(false)
          return
        }
      }

      // Create equipment entry
      const equipmentData = {
        seller_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        brand: formData.brand || null,
        year_manufactured: formData.year_manufactured ? parseInt(formData.year_manufactured) : null,
        condition: formData.condition,
        daily_rate: parseFloat(formData.daily_rate),
        weekly_rate: formData.weekly_rate ? parseFloat(formData.weekly_rate) : null,
        monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        available: true,
      }

      console.log('Inserting equipment:', equipmentData)

      const { data: equipment, error: insertError } = await supabase
        .from('equipment')
        .insert(equipmentData)
        .select()
        .single()

      if (insertError) {
        console.error('Insert error details:', JSON.stringify(insertError, null, 2))
        throw new Error(insertError.message || insertError.details || 'Failed to insert equipment')
      }

      // Upload images if any
      if (images.length > 0 && equipment) {
        try {
          const imageUrls = await uploadMultipleImages(images, equipment.id)
          
          if (imageUrls.length > 0) {
            await supabase
              .from('equipment')
              .update({ images: imageUrls })
              .eq('id', equipment.id)
          }
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr)
          // Continue even if image upload fails
        }
      }

      // Reset form and close
      resetForm()
      onClose()
      router.refresh()
    } catch (err: unknown) {
      console.error('Submit error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add equipment'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      brand: '',
      year_manufactured: '',
      condition: 'good',
      daily_rate: '',
      weekly_rate: '',
      monthly_rate: '',
      latitude: null,
      longitude: null,
    })
    setImages([])
    imagePreview.forEach(url => URL.revokeObjectURL(url))
    setImagePreview([])
    setError(null)
  }

  if (!isOpen) return null

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
          className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Add Equipment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Image upload with paste support */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Images (up to 5) 
                <span className="text-gray-500 font-normal ml-2">
                  <Clipboard className="w-3 h-3 inline mr-1" />
                  Paste from clipboard supported
                </span>
              </label>
              <div 
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-wrap gap-3 p-3 rounded-xl border-2 border-dashed transition-colors ${
                  isDragging ? 'border-teal-500 bg-teal-500/10' : 'border-gray-700'
                }`}
              >
                {imagePreview.map((src, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-600 hover:border-teal-500 transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-teal-400"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
                {images.length === 0 && (
                  <div className="flex-1 min-w-[200px] text-center py-4 text-gray-500 text-sm">
                    Drag & drop, click to browse, or paste (Ctrl+V)
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Equipment Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Philips Ultrasound Machine"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium mb-2">Condition *</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                >
                  <option value="new">Brand New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium mb-2">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Philips"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium mb-2">Year Manufactured</label>
                <input
                  type="number"
                  value={formData.year_manufactured}
                  onChange={(e) => setFormData({ ...formData, year_manufactured: e.target.value })}
                  placeholder="e.g., 2022"
                  min="1990"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Location Picker */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Equipment Location *
                </label>
                <LocationPicker 
                  onLocationChange={handleLocationChange}
                  initialLat={formData.latitude}
                  initialLng={formData.longitude}
                />
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-gray-500 mt-2">
                    📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the equipment, its features, and any maintenance history..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none resize-none"
                />
              </div>

              {/* Pricing */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Pricing</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Daily Rate *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={formData.daily_rate}
                        onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                        placeholder="0"
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Weekly Rate</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={formData.weekly_rate}
                        onChange={(e) => setFormData({ ...formData, weekly_rate: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Monthly Rate</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={formData.monthly_rate}
                        onChange={(e) => setFormData({ ...formData, monthly_rate: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={() => { resetForm(); onClose(); }}
                className="flex-1 py-3 rounded-xl border border-gray-700 font-medium hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.latitude || !formData.longitude}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Equipment'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
