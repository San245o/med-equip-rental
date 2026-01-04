'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AddEquipmentModal from '@/components/AddEquipmentModal'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'
import { Loader2 } from 'lucide-react'

export default function AddEquipmentPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      setCategories(cats || [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading add equipment...
        </div>
      </div>
    )
  }

  return (
    <AddEquipmentModal
      isOpen
      onClose={() => router.back()}
      categories={categories}
    />
  )
}
