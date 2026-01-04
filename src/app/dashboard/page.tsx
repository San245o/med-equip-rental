import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Get user's equipment (if seller)
  const { data: myEquipment } = await supabase
    .from('equipment')
    .select('*, category:categories(*)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Get available equipment (for browsing)
  const { data: availableEquipment } = await supabase
    .from('equipment')
    .select('*, category:categories(*), seller:profiles(*)')
    .eq('available', true)
    .neq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get user's rentals as buyer
  const { data: myRentals } = await supabase
    .from('rentals')
    .select('*, equipment(*), seller:profiles!rentals_seller_id_fkey(*)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  // Get incoming rental requests (as seller)
  const { data: incomingRequests } = await supabase
    .from('rentals')
    .select('*, equipment(*), buyer:profiles!rentals_buyer_id_fkey(*)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Get active rentals for map
  const { data: activeRentals } = await supabase
    .from('rentals')
    .select('*, equipment(*)')
    .in('status', ['active', 'approved'])
    .not('delivery_latitude', 'is', null)

  // Get all equipment with coordinates for map
  const { data: allEquipmentForMap } = await supabase
    .from('equipment')
    .select('*, category:categories(*), seller:profiles(*)')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  return (
    <DashboardClient
      user={user}
      profile={profile}
      categories={categories || []}
      myEquipment={myEquipment || []}
      availableEquipment={availableEquipment || []}
      myRentals={myRentals || []}
      incomingRequests={incomingRequests || []}
      activeRentals={activeRentals || []}
      allEquipmentForMap={allEquipmentForMap || []}
    />
  )
}
