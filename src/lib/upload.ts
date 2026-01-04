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
  index: number
): Promise<string | null> {
  const supabase = createClient()
  
  // Compress the image first
  const compressedFile = await compressImage(file)
  
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
  equipmentId: string | number
): Promise<string[]> {
  const uploadPromises = files.map((file, index) =>
    uploadEquipmentImage(file, equipmentId, index)
  )
  
  const results = await Promise.all(uploadPromises)
  return results.filter((url): url is string => url !== null)
}

export async function deleteEquipmentImage(imageUrl: string): Promise<boolean> {
  const supabase = createClient()
  
  // Extract file path from URL
  const urlParts = imageUrl.split('/equipment-images/')
  if (urlParts.length < 2) return false
  
  const filePath = `equipment/${urlParts[1]}`
  
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
