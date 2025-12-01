/**
 * Auth System - Provider, Gate, Login/Register modaly
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import {
  signUp,
  signIn,
  signOut,
  resetPassword,
  getCurrentUser,
  onAuthStateChange,
  getUserProfile,
  isSupabaseConfigured,
  formatStorageSize,
  getStoragePercentage,
  type UserProfile,
} from '@/lib/supabase'

// Check if Supabase is configured
const SUPABASE_READY = isSupabaseConfigured()
import { LandingPage } from './LandingPage'
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Cloud,
  CreditCard,
  ChevronDown,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'

// ============================================================================
// CONTEXT
// ============================================================================

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// ============================================================================
// AUTH PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState<'login' | 'register' | 'forgot' | null>(null)

  // Initial load
  useEffect(() => {
    // If Supabase is not configured, skip auth init
    if (!SUPABASE_READY) {
      console.warn('Supabase not configured - running in demo mode')
      setLoading(false)
      return
    }
    
    const init = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.id)
          setProfile(userProfile)
        }
      } catch (err: any) {
        console.error('Auth init error:', err)
        // Don't set error, just continue without auth
      } finally {
        setLoading(false)
      }
    }
    
    init()
    
    // Listen for auth changes
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user)
      if (user) {
        try {
          const userProfile = await getUserProfile(user.id)
          setProfile(userProfile)
        } catch (err) {
          console.error('Failed to load profile:', err)
        }
      } else {
        setProfile(null)
      }
    })
    
    return unsubscribe
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    if (!SUPABASE_READY) {
      return { error: 'Supabase není nakonfigurován. Nastavte VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY ve Vercelu.' }
    }
    const { error } = await signIn(email, password)
    if (!error) setShowAuth(null)
    return { error }
  }

  const handleSignUp = async (email: string, password: string, name?: string) => {
    if (!SUPABASE_READY) {
      return { error: 'Supabase není nakonfigurován. Nastavte VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY ve Vercelu.' }
    }
    const { error } = await signUp(email, password, name)
    if (!error) setShowAuth(null)
    return { error }
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user && SUPABASE_READY) {
      const userProfile = await getUserProfile(user.id)
      setProfile(userProfile)
    }
  }

  const contextValue: AuthContextType = {
    user,
    profile,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    refreshProfile,
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Chyba inicializace</h2>
          <p className="text-white/60 max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-white/60">Načítání...</p>
        </div>
      </div>
    )
  }

  // Not logged in - show landing page
  if (!user) {
    return (
      <AuthContext.Provider value={contextValue}>
        <LandingPage
          onLogin={() => setShowAuth('login')}
          onRegister={() => setShowAuth('register')}
        />
        
        <AnimatePresence>
          {showAuth === 'login' || showAuth === 'register' ? (
            <AuthModal
              mode={showAuth}
              onClose={() => setShowAuth(null)}
              onSwitchMode={(mode) => setShowAuth(mode)}
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
            />
          ) : showAuth === 'forgot' ? (
            <ForgotPasswordModal
              onClose={() => setShowAuth(null)}
              onBack={() => setShowAuth('login')}
            />
          ) : null}
        </AnimatePresence>
      </AuthContext.Provider>
    )
  }

  // Logged in - render children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// AUTH MODAL
// ============================================================================

interface AuthModalProps {
  mode: 'login' | 'register'
  onClose: () => void
  onSwitchMode: (mode: 'login' | 'register') => void
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>
}

function AuthModal({ mode, onClose, onSwitchMode, onSignIn, onSignUp }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await onSignIn(email, password)
        if (error) setError(error)
      } else {
        const { error } = await onSignUp(email, password, name)
        if (error) setError(error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'login' ? 'Přihlášení' : 'Registrace'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Jméno</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Novák"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Heslo</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-white/40" />
                  ) : (
                    <Eye className="w-5 h-5 text-white/40" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}
            </button>
            
            {mode === 'login' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => onSwitchMode('forgot' as any)}
                  className="text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Zapomněli jste heslo?
                </button>
              </div>
            )}
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center text-white/60">
            {mode === 'login' ? (
              <>
                Nemáte účet?{' '}
                <button
                  onClick={() => onSwitchMode('register')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Zaregistrujte se
                </button>
              </>
            ) : (
              <>
                Máte účet?{' '}
                <button
                  onClick={() => onSwitchMode('login')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Přihlaste se
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// FORGOT PASSWORD MODAL
// ============================================================================

interface ForgotPasswordModalProps {
  onClose: () => void
  onBack: () => void
}

function ForgotPasswordModal({ onClose, onBack }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error)
      } else {
        setSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <h2 className="text-xl font-semibold text-white">Obnovit heslo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email odeslán!</h3>
              <p className="text-white/60 mb-6">
                Zkontrolujte svou emailovou schránku a klikněte na odkaz pro obnovení hesla.
              </p>
              <button
                onClick={onBack}
                className="px-6 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                Zpět na přihlášení
              </button>
            </div>
          ) : (
            <>
              <p className="text-white/60 mb-6">
                Zadejte svůj email a pošleme vám odkaz pro obnovení hesla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@example.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Odeslat odkaz
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// USER MENU (for logged in users)
// ============================================================================

export function UserMenu() {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const initials = profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'
  const displayName = profile?.name || user.email?.split('@')[0] || 'Uživatel'
  const storagePercent = profile ? getStoragePercentage(profile.storage_used, profile.storage_limit) : 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="text-white/80 text-sm hidden sm:block">{displayName}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute right-0 top-full mt-2 w-72 bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
            >
              {/* User info */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{displayName}</div>
                    <div className="text-sm text-white/50 truncate">{user.email}</div>
                  </div>
                </div>

                {/* Plan badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    profile?.plan === 'pro' ? 'bg-purple-500/20 text-purple-300' :
                    profile?.plan === 'enterprise' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {profile?.plan === 'pro' ? '👑 Pro' : 
                     profile?.plan === 'enterprise' ? '🏢 Enterprise' : 
                     'Free'}
                  </span>
                </div>

                {/* Storage */}
                {profile && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                      <span>Úložiště</span>
                      <span>{formatStorageSize(profile.storage_used)} / {formatStorageSize(profile.storage_limit)}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          storagePercent > 80 ? 'bg-red-500' :
                          storagePercent > 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${storagePercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/80">
                  <Settings className="w-5 h-5 text-white/40" />
                  Nastavení
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/80">
                  <CreditCard className="w-5 h-5 text-white/40" />
                  Předplatné
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/80">
                  <Cloud className="w-5 h-5 text-white/40" />
                  Synchronizace
                </button>
              </div>

              {/* Sign out */}
              <div className="p-2 border-t border-white/10">
                <button 
                  onClick={() => {
                    signOut()
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  Odhlásit se
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
