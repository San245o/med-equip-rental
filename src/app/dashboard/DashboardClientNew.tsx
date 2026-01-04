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
  ChevronRight,
  Menu,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  CreditCard,
  User as UserIcon,
  ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile, Category, Equipment, Rental } from '@/types'
import { formatCurrency, formatDate, getStatusColor, getConditionLabel } from '@/lib/utils'
import EquipmentCard from '@/components/EquipmentCard'
import RentalCard from '@/components/RentalCard'
import AddEquipmentModal from '@/components/AddEquipmentModal'
import dynamic from 'next/dynamic'

// Dynamic import for map (client-side only)
const RentalMap = dynamic(() => import('@/components/RentalMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#141414] rounded-lg border border-[#262626]">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
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
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

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
    { id: 'browse' as Tab, icon: Search, label: 'Browse' },
    { id: 'my-equipment' as Tab, icon: Package, label: 'My Equipment', badge: myEquipment.length },
    { id: 'rentals' as Tab, icon: ShoppingCart, label: 'Rentals', badge: myRentals.filter(r => r.status === 'active').length },
    { id: 'requests' as Tab, icon: Bell, label: 'Requests', badge: incomingRequests.filter(r => r.status === 'pending').length },
    { id: 'map' as Tab, icon: Map, label: 'Map' },
  ]

  const stats = [
    { label: 'Equipment Listed', value: myEquipment.length, change: '+2 this week' },
    { label: 'Active Rentals', value: myRentals.filter(r => r.status === 'active').length + incomingRequests.filter(r => r.status === 'active').length, change: 'Currently active' },
    { label: 'Pending', value: incomingRequests.filter(r => r.status === 'pending').length, change: 'Awaiting response' },
    { label: 'Completed', value: myRentals.filter(r => r.status === 'completed').length, change: 'All time' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-[#0a0a0a] border-r border-[#1c1c1c] transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-[#1c1c1c]">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold text-sm">MedRent</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-[#1c1c1c] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? 'bg-[#1c1c1c] text-white' 
                      : 'text-[#a1a1a1] hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#262626] text-[#a1a1a1]">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-3 border-t border-[#1c1c1c] space-y-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-[#1c1c1c] text-white' 
                  : 'text-[#a1a1a1] hover:text-white hover:bg-[#141414]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1c1c1c]">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-[#1c1c1c] rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-[#737373]">Dashboard</span>
                <ChevronRight className="w-4 h-4 text-[#404040]" />
                <span className="text-white capitalize">{activeTab.replace('-', ' ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Equipment Button */}
              <button
                onClick={() => setShowAddEquipment(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Equipment</span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-[#1c1c1c] rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black text-xs font-semibold">
                    {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#737373] transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                      >
                        {/* User Info */}
                        <div className="p-4 border-b border-[#262626]">
                          <p className="font-medium text-sm">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-[#737373] mt-0.5">{user.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <button className="w-full flex items-center justify-between p-2.5 hover:bg-[#1c1c1c] rounded-lg transition-colors text-left">
                            <div className="flex items-center gap-3">
                              <UserIcon className="w-4 h-4 text-[#737373]" />
                              <span className="text-sm">Profile</span>
                            </div>
                          </button>
                          <button className="w-full flex items-center justify-between p-2.5 hover:bg-[#1c1c1c] rounded-lg transition-colors text-left">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-4 h-4 text-[#737373]" />
                              <span className="text-sm">Subscription</span>
                            </div>
                            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {profile?.role?.toUpperCase() || 'FREE'}
                            </span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('settings')}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-[#1c1c1c] rounded-lg transition-colors text-left"
                          >
                            <Settings className="w-4 h-4 text-[#737373]" />
                            <span className="text-sm">Settings</span>
                          </button>
                        </div>

                        {/* Sign Out */}
                        <div className="p-2 border-t border-[#262626]">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-red-500/10 rounded-lg transition-colors text-left group"
                          >
                            <LogOut className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">Sign out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Welcome */}
                <div>
                  <h1 className="text-xl font-semibold">
                    Welcome back, <span className="text-emerald-400">{profile?.full_name?.split(' ')[0] || 'User'}</span>
                  </h1>
                  <p className="text-sm text-[#737373] mt-1">Here's what's happening with your rentals.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className="bg-[#141414] border border-[#262626] rounded-xl p-4 hover:border-[#333] transition-colors"
                    >
                      <p className="text-xs text-[#737373] uppercase tracking-wider">{stat.label}</p>
                      <p className="text-3xl font-mono font-semibold mt-2">{stat.value}</p>
                      <p className="text-xs text-[#525252] mt-2">{stat.change}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Requests */}
                  <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
                      <h3 className="font-medium text-sm">Recent Requests</h3>
                      <button 
                        onClick={() => setActiveTab('requests')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View all
                      </button>
                    </div>
                    <div className="divide-y divide-[#262626]">
                      {incomingRequests.slice(0, 4).map((request) => (
                        <div key={request.id} className="px-4 py-3 hover:bg-[#1c1c1c] transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{request.equipment?.name || 'Equipment'}</p>
                              <p className="text-xs text-[#737373] mt-0.5">{formatDate(request.created_at)}</p>
                            </div>
                            <span className={`font-mono text-xs px-2 py-0.5 rounded-md ${
                              request.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              request.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-[#262626] text-[#737373]'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {incomingRequests.length === 0 && (
                        <div className="px-4 py-8 text-center text-[#525252] text-sm">
                          No requests yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* My Equipment */}
                  <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between">
                      <h3 className="font-medium text-sm">My Equipment</h3>
                      <button 
                        onClick={() => setActiveTab('my-equipment')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View all
                      </button>
                    </div>
                    <div className="divide-y divide-[#262626]">
                      {myEquipment.slice(0, 4).map((eq) => (
                        <div key={eq.id} className="px-4 py-3 hover:bg-[#1c1c1c] transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{eq.name}</p>
                              <p className="text-xs text-[#737373] mt-0.5 font-mono">{formatCurrency(eq.daily_rate)}/day</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-md ${
                              eq.available 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {eq.available ? 'Available' : 'Rented'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {myEquipment.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <p className="text-[#525252] text-sm mb-3">No equipment listed yet</p>
                          <button
                            onClick={() => setShowAddEquipment(true)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            + Add your first equipment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Browse Equipment Tab */}
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-semibold">Browse Equipment</h1>
                    <p className="text-sm text-[#737373] mt-1">{availableEquipment.length} items available for rent</p>
                  </div>
                  
                  {/* Search */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                    <input
                      type="text"
                      placeholder="Search equipment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-sm focus:outline-none focus:border-[#404040] transition-colors placeholder:text-[#525252]"
                    />
                  </div>
                </div>

                {/* Equipment Grid */}
                {filteredEquipment.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredEquipment.map((eq) => (
                      <EquipmentCard key={eq.id} equipment={eq} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search className="w-12 h-12 mx-auto text-[#333] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No equipment found</h3>
                    <p className="text-sm text-[#737373]">Try adjusting your search</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* My Equipment Tab */}
            {activeTab === 'my-equipment' && (
              <motion.div
                key="my-equipment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold">My Equipment</h1>
                    <p className="text-sm text-[#737373] mt-1">{myEquipment.length} items listed</p>
                  </div>
                  <button
                    onClick={() => setShowAddEquipment(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Equipment
                  </button>
                </div>

                {myEquipment.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {myEquipment.map((eq) => (
                      <EquipmentCard key={eq.id} equipment={eq} isOwner />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#141414] border border-[#262626] rounded-xl">
                    <Package className="w-12 h-12 mx-auto text-[#333] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No equipment yet</h3>
                    <p className="text-sm text-[#737373] mb-4">Start by listing your first piece of equipment</p>
                    <button
                      onClick={() => setShowAddEquipment(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-xl font-semibold">My Rentals</h1>
                  <p className="text-sm text-[#737373] mt-1">Equipment you're renting from others</p>
                </div>

                {myRentals.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myRentals.map((rental) => (
                      <RentalCard key={rental.id} rental={rental} viewType="buyer" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#141414] border border-[#262626] rounded-xl">
                    <ShoppingCart className="w-12 h-12 mx-auto text-[#333] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No rentals yet</h3>
                    <p className="text-sm text-[#737373] mb-4">Browse equipment and request your first rental</p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Browse Equipment →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-xl font-semibold">Rental Requests</h1>
                  <p className="text-sm text-[#737373] mt-1">Manage incoming requests for your equipment</p>
                </div>

                {incomingRequests.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {incomingRequests.map((rental) => (
                      <RentalCard key={rental.id} rental={rental} viewType="seller" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#141414] border border-[#262626] rounded-xl">
                    <Bell className="w-12 h-12 mx-auto text-[#333] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                    <p className="text-sm text-[#737373]">When someone requests your equipment, it will appear here</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-xl font-semibold">Equipment Map</h1>
                  <p className="text-sm text-[#737373] mt-1">Find equipment near you</p>
                </div>

                <div className="h-[calc(100vh-220px)] rounded-xl overflow-hidden border border-[#262626]">
                  <RentalMap 
                    equipment={allEquipmentForMap} 
                    rentals={activeRentals}
                    fullScreen 
                  />
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-2xl"
              >
                <div>
                  <h1 className="text-xl font-semibold">Settings</h1>
                  <p className="text-sm text-[#737373] mt-1">Manage your account and preferences</p>
                </div>

                {/* Profile Section */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#262626]">
                    <h3 className="font-medium text-sm">Profile</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black text-xl font-semibold">
                        {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{profile?.full_name || 'User'}</p>
                        <p className="text-sm text-[#737373]">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-xs text-[#737373] mb-1">Full Name</label>
                        <input
                          type="text"
                          defaultValue={profile?.full_name || ''}
                          className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-sm focus:outline-none focus:border-[#404040] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#737373] mb-1">Hospital Name</label>
                        <input
                          type="text"
                          defaultValue={profile?.hospital_name || ''}
                          className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-sm focus:outline-none focus:border-[#404040] transition-colors"
                        />
                      </div>
                    </div>

                    <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-[#141414] border border-red-500/20 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-red-500/20">
                    <h3 className="font-medium text-sm text-red-400">Danger Zone</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-[#737373] mb-4">Once you sign out, you'll need to sign in again to access your account.</p>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddEquipment(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-black rounded-full shadow-lg shadow-emerald-500/25 flex items-center justify-center transition-colors z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <AddEquipmentModal
        isOpen={showAddEquipment}
        onClose={() => setShowAddEquipment(false)}
        categories={categories}
      />
    </div>
  )
}
