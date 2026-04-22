'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AddEquipmentModal from '@/components/AddEquipmentModal'
import { createClient } from '@/lib/supabase/client'
import type { Category, Equipment } from '@/types'
import { Loader2, AlertCircle } from 'lucide-react'

export default function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const [{ data: categoryRows, error: categoryError }, { data: equipmentRow, error: equipmentError }] =
        await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase
            .from('equipment')
            .select('*')
            .eq('id', resolvedParams.id)
            .eq('seller_id', user.id)
            .single(),
        ])

      if (categoryError) {
        setError('Failed to load categories')
        setLoading(false)
        return
      }

      if (equipmentError || !equipmentRow) {
        setError('Equipment not found or you do not have permission to edit it')
        setLoading(false)
        return
      }

      setCategories(categoryRows || [])
      setEquipment(equipmentRow as Equipment)
      setLoading(false)
    }

    load()
  }, [resolvedParams.id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading equipment editor...
        </div>
      </div>
    )
  }

  if (!equipment || error) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-300">{error || 'Unable to load this equipment listing.'}</p>
        </div>
      </div>
    )
  }

  return (
    <AddEquipmentModal
      isOpen
      onClose={() => router.back()}
      categories={categories}
      mode="edit"
      initialEquipment={equipment}
    />
  )
}
