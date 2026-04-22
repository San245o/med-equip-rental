'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, MapPin, Plus, Trash2, Clipboard } from 'lucide-react'
import { Category, Equipment } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { deleteEquipmentImage, uploadImagesForListingMetadata, uploadMultipleImages } from '@/lib/upload'
import { uploadListingToIpfs } from '@/lib/ipfs'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-xl bg-gray-800 animate-pulse flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
    </div>
  )
})

type ListingImageItem =
  | {
      kind: 'existing'
      previewUrl: string
      imageUrl: string
      ipfsCid?: string
    }
  | {
      kind: 'new'
      previewUrl: string
      file: File
    }

interface EquipmentFormState {
  listing_type: Equipment['listing_type']
  name: string
  description: string
  category_id: string
  brand: string
  year_manufactured: string
  condition: Equipment['condition']
  daily_rate: string
  weekly_rate: string
  monthly_rate: string
  sale_price: string
  latitude: number | null
  longitude: number | null
}

interface AddEquipmentModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  mode?: 'create' | 'edit'
  initialEquipment?: Equipment | null
}

function createEmptyFormData(): EquipmentFormState {
  return {
    listing_type: 'rent',
    name: '',
    description: '',
    category_id: '',
    brand: '',
    year_manufactured: '',
    condition: 'good',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    sale_price: '',
    latitude: null,
    longitude: null,
  }
}

function createFormDataFromEquipment(equipment?: Equipment | null): EquipmentFormState {
  if (!equipment) {
    return createEmptyFormData()
  }

  return {
    listing_type: equipment.listing_type || 'rent',
    name: equipment.name || '',
    description: equipment.description || '',
    category_id: equipment.category_id ? String(equipment.category_id) : '',
    brand: equipment.brand || '',
    year_manufactured: equipment.year_manufactured ? String(equipment.year_manufactured) : '',
    condition: equipment.condition || 'good',
    daily_rate: equipment.listing_type === 'sell' ? '' : String(equipment.daily_rate || ''),
    weekly_rate: equipment.weekly_rate ? String(equipment.weekly_rate) : '',
    monthly_rate: equipment.monthly_rate ? String(equipment.monthly_rate) : '',
    sale_price: equipment.sale_price ? String(equipment.sale_price) : '',
    latitude: equipment.latitude ?? null,
    longitude: equipment.longitude ?? null,
  }
}

function createInitialImageItems(equipment?: Equipment | null): ListingImageItem[] {
  if (!equipment?.images?.length) return []

  return equipment.images.map((imageUrl, index) => ({
    kind: 'existing' as const,
    previewUrl: imageUrl,
    imageUrl,
    ipfsCid: equipment.ipfs_image_cids?.[index],
  }))
}

function revokeImagePreviews(items: ListingImageItem[]) {
  for (const item of items) {
    if (item.kind === 'new') {
      URL.revokeObjectURL(item.previewUrl)
    }
  }
}

function buildEquipmentRecord(formData: EquipmentFormState, sellerId: string) {
  return {
    seller_id: sellerId,
    listing_type: formData.listing_type,
    name: formData.name,
    description: formData.description || null,
    category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
    brand: formData.brand || null,
    year_manufactured: formData.year_manufactured ? parseInt(formData.year_manufactured, 10) : null,
    condition: formData.condition,
    daily_rate: formData.listing_type === 'sell' ? 0 : parseFloat(formData.daily_rate || '0'),
    weekly_rate: formData.listing_type === 'sell'
      ? null
      : (formData.weekly_rate ? parseFloat(formData.weekly_rate) : null),
    monthly_rate: formData.listing_type === 'sell'
      ? null
      : (formData.monthly_rate ? parseFloat(formData.monthly_rate) : null),
    sale_price: formData.listing_type === 'rent'
      ? null
      : (formData.sale_price ? parseFloat(formData.sale_price) : null),
    latitude: formData.latitude,
    longitude: formData.longitude,
    available: true,
  }
}

function appendListingHistory(history: string[] | undefined, nextCid: string): string[] {
  const existingHistory = Array.isArray(history) ? history : []
  return [...existingHistory.filter((cid) => cid !== nextCid), nextCid]
}

export default function AddEquipmentModal({
  isOpen,
  onClose,
  categories,
  mode = 'create',
  initialEquipment = null,
}: AddEquipmentModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const imageItemsRef = useRef<ListingImageItem[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageItems, setImageItems] = useState<ListingImageItem[]>(() => createInitialImageItems(initialEquipment))
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState<EquipmentFormState>(() => createFormDataFromEquipment(initialEquipment))

  const isEditing = mode === 'edit' && Boolean(initialEquipment)

  useEffect(() => {
    imageItemsRef.current = imageItems
  }, [imageItems])

  useEffect(() => {
    return () => {
      revokeImagePreviews(imageItemsRef.current)
    }
  }, [])

  const addImage = useCallback((file: File) => {
    setImageItems((previousItems) => {
      if (previousItems.length >= 5) {
        setError('Maximum 5 images allowed')
        return previousItems
      }

      return [
        ...previousItems,
        {
          kind: 'new',
          file,
          previewUrl: URL.createObjectURL(file),
        },
      ]
    })
  }, [])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
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

    if (files.length + imageItems.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    files.forEach((file) => addImage(file))
    if (e.target) e.target.value = ''
  }

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

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
    if (files.length + imageItems.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    files.forEach((file) => addImage(file))
  }

  const removeImage = (index: number) => {
    setImageItems((previousItems) => {
      const itemToRemove = previousItems[index]
      if (itemToRemove?.kind === 'new') {
        URL.revokeObjectURL(itemToRemove.previewUrl)
      }

      return previousItems.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((previous) => ({ ...previous, latitude: lat, longitude: lng }))
  }

  const resetForm = () => {
    revokeImagePreviews(imageItemsRef.current)
    setFormData(createFormDataFromEquipment(isEditing ? initialEquipment : null))
    setImageItems(createInitialImageItems(isEditing ? initialEquipment : null))
    setError(null)
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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
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

      const equipmentData = buildEquipmentRecord(formData, user.id)
      const existingImageItems = imageItems.filter(
        (item): item is Extract<ListingImageItem, { kind: 'existing' }> => item.kind === 'existing'
      )
      const newImageItems = imageItems.filter(
        (item): item is Extract<ListingImageItem, { kind: 'new' }> => item.kind === 'new'
      )
      const removedExistingImages = (initialEquipment?.images || []).filter(
        (imageUrl) => !existingImageItems.some((item) => item.imageUrl === imageUrl)
      )

      let equipmentId = initialEquipment?.id

      if (!equipmentId) {
        const { data: equipment, error: insertError } = await supabase
          .from('equipment')
          .insert(equipmentData)
          .select()
          .single()

        if (insertError) {
          console.error('Insert error details:', JSON.stringify(insertError, null, 2))
          throw new Error(insertError.message || insertError.details || 'Failed to insert equipment')
        }

        if (!equipment) {
          throw new Error('Failed to create equipment listing')
        }

        equipmentId = equipment.id
      }

      if (!equipmentId) {
        throw new Error('Missing equipment id for publish flow')
      }

      let uploadedNewImageUrls: string[] = []

      try {
        const compressedNewImages = await uploadImagesForListingMetadata(newImageItems.map((item) => item.file))

        if (compressedNewImages.length > 0) {
          uploadedNewImageUrls = await uploadMultipleImages(compressedNewImages, equipmentId, {
            skipCompression: true,
          })

          if (uploadedNewImageUrls.length !== compressedNewImages.length) {
            throw new Error('Failed to upload all listing images')
          }
        }

        const finalImageUrls = [
          ...existingImageItems.map((item) => item.imageUrl),
          ...uploadedNewImageUrls,
        ]

        const listingMetadata = {
          id: equipmentId,
          seller_id: user.id,
          listing_type: formData.listing_type,
          name: formData.name,
          description: formData.description || null,
          category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
          brand: formData.brand || null,
          year_manufactured: formData.year_manufactured ? parseInt(formData.year_manufactured, 10) : null,
          condition: formData.condition,
          daily_rate: equipmentData.daily_rate,
          weekly_rate: equipmentData.weekly_rate,
          monthly_rate: equipmentData.monthly_rate,
          sale_price: equipmentData.sale_price,
          latitude: formData.latitude,
          longitude: formData.longitude,
          images: finalImageUrls,
          previous_listing_ipfs_cid: initialEquipment?.listing_ipfs_cid || null,
          snapshot_reason: isEditing ? 'listing_updated' : 'listing_created',
          source: 'supabase-db',
        }

        const ipfsResult = await uploadListingToIpfs({
          equipmentId,
          metadata: listingMetadata,
          images: compressedNewImages,
          existingImages: existingImageItems.map((item) => ({
            url: item.imageUrl,
            cid: item.ipfsCid,
          })),
        })

        const listingHistory = appendListingHistory(initialEquipment?.listing_ipfs_history, ipfsResult.listingCid)
        const { error: updateError } = await supabase
          .from('equipment')
          .update({
            ...equipmentData,
            images: finalImageUrls,
            ipfs_image_cids: ipfsResult.imageCids,
            listing_ipfs_cid: ipfsResult.listingCid,
            listing_ipfs_history: listingHistory,
          })
          .eq('id', equipmentId)

        if (updateError) {
          throw new Error(updateError.message || 'Failed to save listing IPFS metadata')
        }

        if (removedExistingImages.length > 0) {
          await Promise.all(removedExistingImages.map((imageUrl) => deleteEquipmentImage(imageUrl)))
        }
      } catch (uploadError) {
        if (uploadedNewImageUrls.length > 0) {
          await Promise.all(uploadedNewImageUrls.map((imageUrl) => deleteEquipmentImage(imageUrl)))
        }

        if (!isEditing) {
          await supabase
            .from('equipment')
            .delete()
            .eq('id', equipmentId)
        }

        const message = uploadError instanceof Error
          ? uploadError.message
          : `Failed to ${isEditing ? 'update' : 'publish'} listing to IPFS`
        throw new Error(message)
      }

      resetForm()
      onClose()
      router.refresh()
    } catch (err: unknown) {
      console.error('Submit error:', err)
      const errorMessage = err instanceof Error
        ? err.message
        : `Failed to ${isEditing ? 'update' : 'add'} equipment`
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => {
            if (!loading) onClose()
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Update Equipment' : 'Add Equipment'}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative p-6 overflow-y-auto max-h-[calc(90vh-140px)] pb-28">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

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
                {imageItems.map((item, index) => (
                  <div key={`${item.kind}-${item.previewUrl}-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden group">
                    <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                ))}
                {imageItems.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-600 hover:border-teal-500 transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-teal-400"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
                {imageItems.length === 0 && (
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Listing Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'rent', label: 'For Rent' },
                    { value: 'sell', label: 'For Sale' },
                    { value: 'both', label: 'Rent + Sale' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, listing_type: option.value as Equipment['listing_type'] })}
                      className={`py-2.5 rounded-xl border text-sm transition-colors ${
                        formData.listing_type === option.value
                          ? 'border-teal-500 bg-teal-500/15 text-teal-300'
                          : 'border-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Condition *</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as Equipment['condition'] })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none"
                >
                  <option value="new">Brand New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Pricing</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Daily Rate *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.daily_rate}
                        onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                        placeholder="0"
                        required={formData.listing_type !== 'sell'}
                        disabled={formData.listing_type === 'sell'}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Weekly Rate</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.weekly_rate}
                        onChange={(e) => setFormData({ ...formData, weekly_rate: e.target.value })}
                        placeholder="0"
                        disabled={formData.listing_type === 'sell'}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Monthly Rate</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.monthly_rate}
                        onChange={(e) => setFormData({ ...formData, monthly_rate: e.target.value })}
                        placeholder="0"
                        disabled={formData.listing_type === 'sell'}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 max-w-xs">
                  <label className="block text-xs text-gray-400 mb-1">
                    Sale Price {formData.listing_type === 'rent' ? '(optional)' : '*'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      placeholder="0"
                      required={formData.listing_type !== 'rent'}
                      disabled={formData.listing_type === 'rent'}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-teal-500 outline-none disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none">
              <div className="sticky bottom-0 pt-4">
                <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/90 backdrop-blur p-4 shadow-2xl pointer-events-auto">
                  <div className="flex flex-col gap-2 text-xs text-gray-400 mb-3">
                    <span>
                      {isEditing
                        ? 'Each update publishes a fresh immutable IPFS snapshot and appends it to listing history.'
                        : 'Publishing creates an immutable IPFS snapshot for buyers to verify later.'}
                    </span>
                    {!formData.latitude || !formData.longitude ? (
                      <span className="text-amber-400">Location is required to publish this listing.</span>
                    ) : null}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm()
                        onClose()
                      }}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl border border-gray-700 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          {isEditing ? 'Republishing...' : 'Publishing...'}
                        </>
                      ) : (
                        isEditing ? 'Update Listing' : 'Add Equipment'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
