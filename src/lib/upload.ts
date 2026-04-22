import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'

const MAX_SIZE_MB = 1
const MAX_WIDTH_OR_HEIGHT = 1920

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    // Rename to .webp extension
    const newFileName = file.name.replace(/\.[^/.]+$/, '.webp')
    return new File([compressedFile], newFileName, { type: 'image/webp' })
  } catch (error) {
    console.error('Image compression failed:', error)
    return file // Return original if compression fails
  }
}

export async function uploadEquipmentImage(
  file: File,
  equipmentId: string | number,
  index: number,
  options?: { skipCompression?: boolean }
): Promise<string | null> {
  const supabase = createClient()
  
  // Compress the image first
  const compressedFile = options?.skipCompression ? file : await compressImage(file)
  
  const fileName = `${equipmentId}/${Date.now()}-${index}.webp`
  const filePath = `equipment/${fileName}`

  const { error } = await supabase.storage
    .from('equipment-images')
    .upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('equipment-images')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function uploadMultipleImages(
  files: File[],
  equipmentId: string | number,
  options?: { skipCompression?: boolean }
): Promise<string[]> {
  const uploadPromises = files.map((file, index) =>
    uploadEquipmentImage(file, equipmentId, index, options)
  )
  
  const results = await Promise.all(uploadPromises)
  return results.filter((url): url is string => url !== null)
}

export async function uploadImagesForListingMetadata(files: File[]): Promise<File[]> {
  const compressedFiles = await Promise.all(files.map((file) => compressImage(file)))
  return compressedFiles
}

export async function deleteEquipmentImage(imageUrl: string): Promise<boolean> {
  const supabase = createClient()
  
  // Extract relative path from public URL: .../equipment-images/<path>
  const marker = '/equipment-images/'
  const markerIndex = imageUrl.indexOf(marker)
  if (markerIndex === -1) return false
  const filePath = imageUrl.slice(markerIndex + marker.length)
  if (!filePath) return false
  
  const { error } = await supabase.storage
    .from('equipment-images')
    .remove([filePath])

  if (error) {
    console.error('Delete error:', error)
    return false
  }

  return true
}

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string | null> {
  const supabase = createClient()
  
  const compressedFile = await compressImage(file)
  const filePath = `avatars/${userId}.webp`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    console.error('Avatar upload error:', error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return publicUrl
}
