'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { HeartPulse, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'buyer' | 'seller' | 'both'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') as Role | null
  
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [role, setRole] = useState<Role>(defaultRole || 'both')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 1) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      setError(null)
      setStep(2)
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          hospital_name: hospitalName,
          role,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const roles = [
    {
      value: 'buyer' as Role,
      label: 'Rent Equipment',
      description: 'Browse and rent medical equipment from other hospitals',
      icon: '🏥',
    },
    {
      value: 'seller' as Role,
      label: 'List Equipment',
      description: 'List your idle equipment and earn rental income',
      icon: '💰',
    },
    {
      value: 'both' as Role,
      label: 'Both',
      description: 'Rent from others and list your own equipment',
      icon: '🔄',
    },
  ]

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-purple-500/20" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-teal-500/30 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 text-center max-w-lg"
        >
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ y: 0 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-2xl"
              >
                {i === 1 ? '🏥' : i === 2 ? '🔬' : '💉'}
              </motion.div>
            ))}
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Join the Network of<br />
            <span className="gradient-text">Healthcare Excellence</span>
          </h2>
          <p className="text-xl text-gray-400">
            Over 500+ hospitals are already sharing resources and saving millions in equipment costs.
          </p>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">MedRent</span>
          </Link>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-teal-500' : 'bg-gray-800'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-teal-500' : 'bg-gray-800'}`} />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {step === 1 ? 'Create your account' : 'Complete your profile'}
          </h1>
          <p className="text-gray-400 mb-8">
            {step === 1 
              ? 'Start renting or listing medical equipment today.'
              : 'Tell us about yourself and your organization.'}
          </p>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@hospital.com"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. John Smith"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hospital / Organization</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="Metro General Hospital"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">I want to...</label>
                  <div className="grid gap-3">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          role === r.value
                            ? 'border-teal-500 bg-teal-500/10'
                            : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{r.icon}</span>
                          <div>
                            <div className="font-medium">{r.label}</div>
                            <div className="text-sm text-gray-400">{r.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 font-semibold hover:bg-gray-900 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {step === 1 ? 'Continue' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
