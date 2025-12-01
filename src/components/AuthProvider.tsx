/**
 * AuthProvider - Autentizační UI komponenta
 * 
 * Funkce:
 * - Email/password login a registrace
 * - Google OAuth
 * - Uživatelský profil
 * - Storage usage
 * - Session management
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { supabase, formatStorageSize, getStoragePercentage, type User, type SupabaseConfig } from '@/lib/supabase-client'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

// =============================================================================
// ICONS (inline to avoid import issues)
// =============================================================================

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const LogOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const CloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin", className)} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// =============================================================================
// CONTEXT
// =============================================================================

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  syncData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Return mock context if not wrapped
    return {
      user: null,
      isLoading: false,
      isConfigured: false,
      signIn: async () => ({ success: false, error: 'Not configured' }),
      signUp: async () => ({ success: false, error: 'Not configured' }),
      signInWithGoogle: async () => {},
      signOut: async () => {},
      syncData: async () => {},
    }
  }
  return context
}

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)
  
  const store = useAppStore()
  const supabaseConfig = (store as any).supabaseConfig
  const brandKits = store.brandKits
  const creatives = store.creatives
  
  // Initialize Supabase
  useEffect(() => {
    const init = async () => {
      if (supabaseConfig?.url && supabaseConfig?.anonKey) {
        const success = await supabase.initialize(supabaseConfig)
        setIsConfigured(success)
        if (success) {
          setUser(supabase.getCurrentUser())
        }
      }
      setIsLoading(false)
    }
    
    init()
    
    // Listen for auth changes
    const unsubscribe = supabase.onAuthChange((newUser) => {
      setUser(newUser)
    })
    
    return unsubscribe
  }, [supabaseConfig])
  
  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    
    if (accessToken && refreshToken) {
      supabase.handleOAuthCallback(accessToken, refreshToken).then(() => {
        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname)
      })
    }
  }, [])
  
  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    const result = await supabase.signIn(email, password)
    setIsLoading(false)
    return result
  }
  
  const signUp = async (email: string, password: string, name?: string) => {
    setIsLoading(true)
    const result = await supabase.signUp(email, password, name)
    setIsLoading(false)
    return result
  }
  
  const signInWithGoogle = async () => {
    const result = await supabase.signInWithGoogle()
    if ('url' in result) {
      window.location.href = result.url
    }
  }
  
  const signOut = async () => {
    await supabase.signOut()
  }
  
  const syncData = async () => {
    if (!user) return
    
    // Sync brand kits
    await supabase.saveUserData('brandKits', brandKits)
    
    // Sync creatives metadata (not images - those go to storage)
    const creativesMetadata = creatives.map(c => ({
      ...c,
      imageUrl: undefined, // Don't store base64 in DB
    }))
    await supabase.saveUserData('creatives', creativesMetadata)
  }
  
  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isConfigured,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      syncData,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// =============================================================================
// LOGIN MODAL
// =============================================================================

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const auth = useAuth()
  const store = useAppStore()
  const supabaseConfig = (store as any).supabaseConfig
  const setSupabaseConfig = (store as any).setSupabaseConfig
  
  const [mode, setMode] = useState<'login' | 'register' | 'config'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Config state
  const [configUrl, setConfigUrl] = useState(supabaseConfig?.url || '')
  const [configKey, setConfigKey] = useState(supabaseConfig?.anonKey || '')
  
  if (!isOpen) return null
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (mode === 'config') {
      if (setSupabaseConfig) {
        setSupabaseConfig({ url: configUrl, anonKey: configKey })
      }
      setSuccess('Konfigurace uložena! Obnovte stránku.')
      return
    }
    
    if (!auth.isConfigured) {
      setError('Supabase není nakonfigurován. Klikněte na "Nastavit Supabase".')
      return
    }
    
    const result = mode === 'login' 
      ? await auth.signIn(email, password)
      : await auth.signUp(email, password, name)
    
    if (result.success) {
      setSuccess(mode === 'login' ? 'Přihlášení úspěšné!' : 'Registrace úspěšná!')
      setTimeout(() => onClose(), 1000)
    } else {
      setError(result.error || 'Něco se pokazilo')
    }
  }
  
  const handleGoogleLogin = async () => {
    if (!auth.isConfigured) {
      setError('Supabase není nakonfigurován')
      return
    }
    await auth.signInWithGoogle()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {mode === 'login' ? 'Přihlášení' : mode === 'register' ? 'Registrace' : 'Nastavení Supabase'}
                </h3>
                <p className="text-sm text-gray-500">
                  {mode === 'config' ? 'Zadejte přihlašovací údaje' : 'Synchronizujte kreativy v cloudu'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Config mode */}
          {mode === 'config' ? (
            <>
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 mb-4">
                <p className="font-medium mb-2">Jak nastavit Supabase (zdarma):</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Jděte na <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline">supabase.com</a></li>
                  <li>Vytvořte nový projekt</li>
                  <li>V Settings → API najdete URL a anon key</li>
                  <li>Vytvořte tabulky (SQL níže)</li>
                </ol>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Project URL</label>
                <input
                  type="url"
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  placeholder="https://xxx.supabase.co"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Anon Key</label>
                <input
                  type="password"
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                  SQL pro vytvoření tabulek
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">
{`-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  storage_used BIGINT DEFAULT 0,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User data (JSON storage)
CREATE TABLE user_data (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  key TEXT,
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own data" ON user_data
  FOR ALL USING (auth.uid() = user_id);`}
                </pre>
              </details>
            </>
          ) : (
            <>
              {/* Login/Register form */}
              {!auth.isConfigured && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="text-yellow-800 font-medium">Supabase není nakonfigurován</p>
                  <button 
                    type="button"
                    onClick={() => setMode('config')}
                    className="text-yellow-700 underline"
                  >
                    Nastavit nyní
                  </button>
                </div>
              )}
              
              {mode === 'register' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Jméno</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jan Novák"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas@email.cz"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Heslo</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 border rounded-lg"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              
              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">nebo</span>
                </div>
              </div>
              
              {/* Google login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={!auth.isConfigured || auth.isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Pokračovat přes Google
              </button>
            </>
          )}
          
          {/* Error/Success messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✅ {success}
            </div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={auth.isLoading}
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {auth.isLoading ? (
              <LoaderIcon className="w-5 h-5" />
            ) : mode === 'login' ? (
              '🔐 Přihlásit se'
            ) : mode === 'register' ? (
              '📝 Registrovat'
            ) : (
              '💾 Uložit konfiguraci'
            )}
          </button>
          
          {/* Mode switch */}
          {mode !== 'config' && (
            <div className="text-center text-sm text-gray-600">
              {mode === 'login' ? (
                <>
                  Nemáte účet?{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-blue-600 hover:underline">
                    Zaregistrujte se
                  </button>
                </>
              ) : (
                <>
                  Již máte účet?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-blue-600 hover:underline">
                    Přihlaste se
                  </button>
                </>
              )}
            </div>
          )}
          
          {mode !== 'config' && (
            <div className="text-center">
              <button 
                type="button"
                onClick={() => setMode('config')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ⚙️ Nastavit Supabase
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// =============================================================================
// USER MENU
// =============================================================================

interface UserMenuProps {
  onOpenLogin: () => void
}

export function UserMenu({ onOpenLogin }: UserMenuProps) {
  const auth = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const handleSync = async () => {
    setIsSyncing(true)
    await auth.syncData()
    setIsSyncing(false)
  }
  
  if (!auth.user) {
    return (
      <button 
        onClick={onOpenLogin}
        className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-sm"
      >
        <UserIcon className="w-4 h-4" />
        Přihlásit
      </button>
    )
  }
  
  const user = auth.user
  const storagePercent = getStoragePercentage(user.storageUsed, user.storageLimit)
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
            {user.name?.[0] || user.email[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.name || user.email.split('@')[0]}
        </span>
        {user.plan === 'pro' && <span>👑</span>}
      </button>
      
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border z-50">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              {/* Plan badge */}
              <div className="mt-3 flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  user.plan === 'pro' ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"
                )}>
                  {user.plan === 'pro' ? '👑 Pro' : 'Free'}
                </span>
                {user.plan === 'free' && (
                  <button className="text-xs text-blue-600 hover:underline">
                    Upgradovat
                  </button>
                )}
              </div>
            </div>
            
            {/* Storage */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  💾 Úložiště
                </span>
                <span className="text-sm font-medium">
                  {formatStorageSize(user.storageUsed)} / {formatStorageSize(user.storageLimit)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    storagePercent > 80 ? "bg-red-500" : storagePercent > 50 ? "bg-yellow-500" : "bg-green-500"
                  )}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              {storagePercent > 80 && (
                <p className="text-xs text-orange-600 mt-1">
                  Dochází místo! Zvažte upgrade na Pro.
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {isSyncing ? <LoaderIcon className="w-4 h-4" /> : <CloudIcon className="w-4 h-4" />}
                {isSyncing ? 'Synchronizuji...' : 'Synchronizovat data'}
              </button>
              
              <button
                onClick={() => { auth.signOut(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOutIcon className="w-4 h-4" />
                Odhlásit se
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// =============================================================================
// SYNC STATUS
// =============================================================================

export function SyncStatus() {
  const auth = useAuth()
  
  if (!auth.isConfigured) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        ☁️ Offline
      </div>
    )
  }
  
  if (!auth.user) {
    return null
  }
  
  return (
    <div className="flex items-center gap-1 text-xs text-green-600">
      ☁️ Synced
    </div>
  )
}

export default AuthProvider
