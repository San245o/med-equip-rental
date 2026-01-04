'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HeartPulse, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Map, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus, 
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile, Category, Equipment, Rental } from '@/types'
import { formatCurrency, formatDate, getStatusColor, getConditionLabel } from '@/lib/utils'
import EquipmentCard from '@/components/EquipmentCard'
import RentalCard from '@/components/RentalCard'
import dynamic from 'next/dynamic'

// Dynamic import for map (client-side only)
const RentalMap = dynamic(() => import('@/components/RentalMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#0a0a0a] rounded-lg">
      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )
})

type Tab = 'overview' | 'browse' | 'my-equipment' | 'rentals' | 'requests' | 'map' | 'messages' | 'settings'

interface DashboardClientProps {
  user: User
  profile: Profile | null
  categories: Category[]
  myEquipment: Equipment[]
  availableEquipment: Equipment[]
  myRentals: Rental[]
  incomingRequests: Rental[]
  activeRentals: Rental[]
  allEquipmentForMap: Equipment[]
}

export default function DashboardClient({
  user,
  profile,
  categories,
  myEquipment,
  availableEquipment,
  myRentals,
  incomingRequests,
  activeRentals,
  allEquipmentForMap,
}: DashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const filteredEquipment = availableEquipment.filter(eq => 
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const navItems = [
    { id: 'overview' as Tab, icon: LayoutDashboard, label: 'Overview' },
    { id: 'browse' as Tab, icon: Search, label: 'Browse Equipment' },
    { id: 'my-equipment' as Tab, icon: Package, label: 'My Equipment', badge: myEquipment.length },
    { id: 'rentals' as Tab, icon: ShoppingCart, label: 'My Rentals', badge: myRentals.filter(r => r.status === 'active').length },
    { id: 'requests' as Tab, icon: Bell, label: 'Requests', badge: incomingRequests.filter(r => r.status === 'pending').length },
    { id: 'map' as Tab, icon: Map, label: 'Live Map' },
    { id: 'messages' as Tab, icon: MessageSquare, label: 'Messages' },
    { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
  ]

  const stats = [
    { 
      label: 'Listed Equipment', 
      value: myEquipment.length, 
      icon: Package, 
      color: 'bg-emerald-600' 
    },
    { 
      label: 'Active Rentals', 
      value: myRentals.filter(r => r.status === 'active').length + incomingRequests.filter(r => r.status === 'active').length, 
      icon: Clock, 
      color: 'bg-blue-600' 
    },
    { 
      label: 'Pending Requests', 
      value: incomingRequests.filter(r => r.status === 'pending').length, 
      icon: AlertCircle, 
      color: 'bg-amber-600' 
    },
    { 
      label: 'Completed', 
      value: myRentals.filter(r => r.status === 'completed').length, 
      icon: CheckCircle2, 
      color: 'bg-green-600' 
    },
  ]

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-[#262626] transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">MedRent</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-[#1a1a1a] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium font-mono bg-emerald-500/20 text-emerald-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[#262626]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-medium">
                {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{profile?.full_name || 'User'}</div>
                <div className="text-sm text-gray-500 truncate">{profile?.hospital_name || user.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-[#262626]">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-[#1a1a1a] rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold">
                {navItems.find(i => i.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {(activeTab === 'overview' || activeTab === 'my-equipment') && (
                <button
                  onClick={() => router.push('/dashboard/add-equipment')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Equipment</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 rounded-lg bg-[#141414] border border-[#262626]"
                    >
                      <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold font-mono mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent equipment */}
                  <div className="bg-[#141414] rounded-lg border border-[#262626] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-gray-300">My Equipment</h3>
                      <button 
                        onClick={() => setActiveTab('my-equipment')}
                        className="text-xs text-emerald-500 hover:text-emerald-400"
                      >
                        View all
                      </button>
                    </div>
                    {myEquipment.length > 0 ? (
                      <div className="space-y-3">
                        {myEquipment.slice(0, 3).map((eq) => (
                          <div key={eq.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#0a0a0a]">
                            <div className="w-12 h-12 rounded-lg bg-[#262626] flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{eq.name}</div>
                              <div className="text-sm text-gray-500 font-mono">{formatCurrency(eq.daily_rate)}/day</div>
                            </div>
                            <div className={`px-2 py-1 text-xs font-mono rounded ${eq.available ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {eq.available ? 'Available' : 'Rented'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No equipment listed yet</p>
                        <button
                          onClick={() => router.push('/dashboard/add-equipment')}
                          className="mt-3 text-emerald-500 hover:text-emerald-400 font-medium text-sm"
                        >
                          Add your first equipment
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pending requests */}
                  <div className="bg-[#141414] rounded-lg border border-[#262626] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-gray-300">Pending Requests</h3>
                      <button 
                        onClick={() => setActiveTab('requests')}
                        className="text-xs text-emerald-500 hover:text-emerald-400"
                      >
                        View all
                      </button>
                    </div>
                    {incomingRequests.filter(r => r.status === 'pending').length > 0 ? (
                      <div className="space-y-3">
                        {incomingRequests.filter(r => r.status === 'pending').slice(0, 3).map((rental) => (
                          <div key={rental.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#0a0a0a]">
                            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{rental.equipment?.name}</div>
                              <div className="text-sm text-gray-500">from {rental.buyer?.full_name}</div>
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {formatDate(rental.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No pending requests</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick map view */}
                <div className="bg-[#141414] rounded-lg border border-[#262626] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm uppercase tracking-wide text-gray-300">Active Rentals Map</h3>
                    <button 
                      onClick={() => setActiveTab('map')}
                      className="text-xs text-emerald-500 hover:text-emerald-400"
                    >
                      Full screen
                    </button>
                  </div>
                  <div className="h-64 rounded-lg overflow-hidden">
                    <RentalMap rentals={activeRentals} equipment={allEquipmentForMap} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search equipment..."
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-[#141414] border border-[#262626] focus:border-emerald-500 outline-none transition-colors text-sm"
                    />
                  </div>
                  <select className="px-4 py-3 rounded-lg bg-[#141414] border border-[#262626] focus:border-emerald-500 outline-none text-sm">
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Equipment grid */}
                {filteredEquipment.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredEquipment.map((eq) => (
                      <EquipmentCard 
                        key={eq.id} 
                        equipment={eq}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium mb-2">No equipment found</h3>
                    <p>Try adjusting your search or filters</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* My Equipment Tab */}
            {activeTab === 'my-equipment' && (
              <motion.div
                key="my-equipment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {myEquipment.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {myEquipment.map((eq) => (
                      <EquipmentCard 
                        key={eq.id} 
                        equipment={eq} 
                        isOwner
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-medium mb-2">No equipment listed</h3>
                    <p className="text-gray-500 mb-6">Start earning by listing your idle medical equipment</p>
                    <button
                      onClick={() => router.push('/dashboard/add-equipment')}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Add Equipment
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Rentals Tab */}
            {activeTab === 'rentals' && (
              <motion.div
                key="rentals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {myRentals.length > 0 ? (
                  myRentals.map((rental) => (
                    <RentalCard key={rental.id} rental={rental} viewType="buyer" />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-medium mb-2">No rentals yet</h3>
                    <p className="text-gray-500 mb-6">Browse available equipment and request rentals</p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                    >
                      Browse Equipment
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {incomingRequests.length > 0 ? (
                  incomingRequests.map((rental) => (
                    <RentalCard key={rental.id} rental={rental} viewType="seller" />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-medium mb-2">No rental requests</h3>
                    <p className="text-gray-400">Requests from other hospitals will appear here</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-[calc(100vh-180px)]"
              >
                <RentalMap rentals={activeRentals} equipment={allEquipmentForMap} fullScreen />
              </motion.div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-medium mb-2">Messages coming soon</h3>
                <p className="text-gray-400">In-app messaging will be available in the next update</p>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl space-y-6"
              >
                <div className="bg-[#141414] rounded-lg border border-[#262626] p-6">
                  <h3 className="font-medium text-sm uppercase tracking-wide text-gray-300 mb-4">Profile Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        defaultValue={profile?.full_name || ''}
                        className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Hospital Name</label>
                      <input
                        type="text"
                        defaultValue={profile?.hospital_name || ''}
                        className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Phone</label>
                      <input
                        type="tel"
                        defaultValue={profile?.phone || ''}
                        className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Address</label>
                      <textarea
                        defaultValue={profile?.address || ''}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#262626] focus:border-emerald-500 outline-none resize-none text-sm"
                      />
                    </div>
                    <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

    </div>
  )
}
