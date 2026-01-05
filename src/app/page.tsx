'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Activity, 
  ArrowRight, 
  Building2, 
  Clock, 
  Globe2, 
  HeartPulse, 
  MapPin, 
  MessageSquare, 
  Phone, 
  Scan, 
  Shield, 
  Sparkles, 
  Star, 
  Stethoscope, 
  TrendingUp, 
  Users,
  Zap,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const categories = [
  { icon: Scan, name: 'Imaging', description: 'MRI, CT, X-Ray, Ultrasound' },
  { icon: Activity, name: 'Monitoring', description: 'Vital signs, ECG, SpO2' },
  { icon: HeartPulse, name: 'Surgical', description: 'OR tables, lights, instruments' },
  { icon: Stethoscope, name: 'Diagnostic', description: 'Endoscopes, analyzers' },
]

const stats = [
  { value: '500+', label: 'Hospitals Connected' },
  { value: '12K+', label: 'Equipment Listed' },
  { value: '$2.5M+', label: 'Saved in Costs' },
  { value: '98%', label: 'Satisfaction Rate' },
]

const steps = [
  {
    step: '01',
    title: 'List or Browse',
    description: 'Sellers list their available equipment. Buyers browse the marketplace or search by category and location.',
    icon: Globe2,
  },
  {
    step: '02',
    title: 'Request & Approve',
    description: 'Submit rental requests with your preferred dates. Equipment owners review and approve within 24 hours.',
    icon: MessageSquare,
  },
  {
    step: '03',
    title: 'Track & Manage',
    description: 'Track active rentals on the live map. Manage deliveries, extensions, and returns seamlessly.',
    icon: MapPin,
  },
]

const testimonials = [
  {
    quote: "MedRent transformed how we manage equipment overflow. We've generated $50K in rental income from idle assets.",
    author: 'Dr. Sarah Chen',
    role: 'Chief Medical Officer',
    hospital: 'Metro General Hospital',
    rating: 5,
  },
  {
    quote: "During our ICU expansion, we rented 20 ventilators within 48 hours. The live map feature is incredibly useful.",
    author: 'James Rodriguez',
    role: 'Procurement Director',
    hospital: 'Valley Health Center',
    rating: 5,
  },
  {
    quote: "The verification system gives us confidence that equipment meets our standards. Truly a game-changer.",
    author: 'Dr. Emily Watson',
    role: 'Department Head',
    hospital: 'University Medical Center',
    rating: 5,
  },
]

const features = [
  {
    icon: Shield,
    title: 'Verified Equipment',
    description: 'All equipment is verified and certified for medical use with complete maintenance history.',
  },
  {
    icon: Zap,
    title: 'Instant Matching',
    description: 'Our algorithm matches your needs with nearby available equipment in real-time.',
  },
  {
    icon: Clock,
    title: 'Flexible Duration',
    description: 'Rent by day, week, or month. Extend or return early with our flexible terms.',
  },
  {
    icon: TrendingUp,
    title: 'Cost Optimization',
    description: 'Save up to 70% compared to purchasing new equipment for temporary needs.',
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">MedRent-Tinkering Lab project</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
              <Link 
                href="/signup" 
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all btn-shine"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-gray-300">Features</a>
              <a href="#how-it-works" className="block py-2 text-gray-300">How It Works</a>
              <a href="#testimonials" className="block py-2 text-gray-300">Testimonials</a>
              <Link href="/login" className="block py-2 text-gray-300">Login</Link>
              <Link 
                href="/signup" 
                className="block w-full text-center px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full font-medium"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 grid-pattern noise">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/30 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-gray-300">Trusted by 500+ Healthcare Facilities</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
            >
              <span className="block">Medical Equipment</span>
              <span className="gradient-text">Rental Marketplace</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10"
            >
              Connect with hospitals nationwide. Rent premium medical equipment 
              on-demand or monetize your idle assets.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                href="/signup"
                className="group px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-teal-500/30 transition-all flex items-center gap-2 btn-shine"
              >
                Start Renting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/signup?role=seller"
                className="px-8 py-4 border border-gray-700 rounded-full font-semibold text-lg hover:bg-white/5 hover:border-gray-600 transition-all"
              >
                List Your Equipment
              </Link>
            </motion.div>
          </div>

          {/* Floating cards preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                  className="p-6 rounded-2xl glass card-hover cursor-pointer"
                >
                  <cat.icon className="w-10 h-10 text-teal-400 mb-4" />
                  <h3 className="font-semibold mb-1">{cat.name}</h3>
                  <p className="text-sm text-gray-400">{cat.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-3 bg-teal-400 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="gradient-text">MedRent</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built specifically for healthcare facilities, with features that matter.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl glass card-hover group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get started in minutes. No complex setup required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-teal-500/50 to-transparent" />
                )}
                <div className="gradient-border p-8 h-full">
                  <div className="text-6xl font-bold text-teal-500/20 mb-4">{item.step}</div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by <span className="gradient-text">Healthcare Leaders</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what medical professionals are saying about MedRent.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.author}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl glass card-hover"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(item.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6 text-gray-300">&quot;{item.quote}&quot;</p>
                <div>
                  <div className="font-semibold">{item.author}</div>
                  <div className="text-sm text-gray-400">{item.role}</div>
                  <div className="text-sm text-teal-400">{item.hospital}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-90" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            
            <div className="relative z-10 px-8 py-16 md:py-24 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your<br />Equipment Management?
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                Join hundreds of hospitals already saving costs and generating 
                revenue through smart equipment sharing.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/signup"
                  className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#"
                  className="px-8 py-4 border border-white/30 rounded-full font-semibold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Schedule Demo
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">MedRent</span>
              </Link>
              <p className="text-gray-400 text-sm">
                The premier marketplace for medical equipment rental between healthcare facilities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Browse Equipment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">List Equipment</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 MedRent. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe2 className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
