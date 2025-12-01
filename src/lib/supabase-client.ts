/**
 * Supabase Client - Authentication & Storage
 * 
 * Free Tier:
 * - Auth: Unlimited users, email + social logins
 * - Storage: 1GB pro uživatelská data
 * - Database: 500MB PostgreSQL
 * - API: Unlimited requests
 * 
 * Setup:
 * 1. Vytvoř projekt na supabase.com
 * 2. Zkopíruj URL a anon key
 * 3. Nastav v Settings
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  createdAt: Date
  storageUsed: number // bytes
  storageLimit: number // 100MB per free user
  plan: 'free' | 'pro'
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
  session?: any
}

export interface StorageResult {
  success: boolean
  url?: string
  path?: string
  error?: string
  sizeBytes?: number
}

// Storage limits
export const STORAGE_LIMITS = {
  free: 100 * 1024 * 1024, // 100MB
  pro: 1024 * 1024 * 1024, // 1GB
}

// =============================================================================
// SUPABASE CLIENT WRAPPER
// =============================================================================

class SupabaseClientWrapper {
  private config: SupabaseConfig | null = null
  private client: any = null
  private currentUser: User | null = null
  private listeners: Set<(user: User | null) => void> = new Set()
  
  /**
   * Inicializuje Supabase klienta
   */
  async initialize(config: SupabaseConfig): Promise<boolean> {
    if (!config.url || !config.anonKey) {
      console.error('Missing Supabase config')
      return false
    }
    
    this.config = config
    
    // V produkci bychom použili @supabase/supabase-js
    // Pro demo použijeme fetch API přímo
    try {
      // Test connection
      const response = await fetch(`${config.url}/rest/v1/`, {
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Connection failed')
      }
      
      // Check for existing session
      await this.checkSession()
      
      return true
    } catch (error) {
      console.error('Supabase initialization failed:', error)
      return false
    }
  }
  
  /**
   * Zkontroluje existující session
   */
  private async checkSession(): Promise<void> {
    const sessionData = localStorage.getItem('supabase-session')
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData)
        if (session.access_token && session.user) {
          // Verify token is still valid
          const user = await this.getUser(session.user.id)
          if (user) {
            this.currentUser = user
            this.notifyListeners()
          }
        }
      } catch {
        localStorage.removeItem('supabase-session')
      }
    }
  }
  
  /**
   * Email/Password registrace
   */
  async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    if (!this.config) {
      return { success: false, error: 'Supabase není inicializován' }
    }
    
    try {
      const response = await fetch(`${this.config.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.anonKey,
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Registrace selhala' }
      }
      
      // Create user profile
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: name || email.split('@')[0],
        createdAt: new Date(),
        storageUsed: 0,
        storageLimit: STORAGE_LIMITS.free,
        plan: 'free',
      }
      
      await this.createUserProfile(user)
      
      // Save session
      if (data.access_token) {
        localStorage.setItem('supabase-session', JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        }))
        
        this.currentUser = user
        this.notifyListeners()
      }
      
      return { success: true, user, session: data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Registrace selhala' }
    }
  }
  
  /**
   * Email/Password přihlášení
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!this.config) {
      return { success: false, error: 'Supabase není inicializován' }
    }
    
    try {
      const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.anonKey,
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Přihlášení selhalo' }
      }
      
      // Get user profile
      const user = await this.getUser(data.user.id)
      
      // Save session
      localStorage.setItem('supabase-session', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      }))
      
      this.currentUser = user
      this.notifyListeners()
      
      return { success: true, user: user || undefined, session: data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Přihlášení selhalo' }
    }
  }
  
  /**
   * Google OAuth přihlášení
   */
  async signInWithGoogle(): Promise<{ url: string } | { error: string }> {
    if (!this.config) {
      return { error: 'Supabase není inicializován' }
    }
    
    const redirectUrl = window.location.origin + '/auth/callback'
    const authUrl = `${this.config.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`
    
    return { url: authUrl }
  }
  
  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(accessToken: string, refreshToken: string): Promise<AuthResult> {
    if (!this.config) {
      return { success: false, error: 'Supabase není inicializován' }
    }
    
    try {
      // Get user from token
      const response = await fetch(`${this.config.url}/auth/v1/user`, {
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      })
      
      const userData = await response.json()
      
      if (!response.ok) {
        return { success: false, error: 'Nepodařilo se získat uživatele' }
      }
      
      // Check/create user profile
      let user = await this.getUser(userData.id)
      if (!user) {
        user = {
          id: userData.id,
          email: userData.email,
          name: userData.user_metadata?.full_name || userData.email.split('@')[0],
          avatarUrl: userData.user_metadata?.avatar_url,
          createdAt: new Date(),
          storageUsed: 0,
          storageLimit: STORAGE_LIMITS.free,
          plan: 'free',
        }
        await this.createUserProfile(user)
      }
      
      // Save session
      localStorage.setItem('supabase-session', JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: userData,
      }))
      
      this.currentUser = user
      this.notifyListeners()
      
      return { success: true, user }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Odhlášení
   */
  async signOut(): Promise<void> {
    localStorage.removeItem('supabase-session')
    this.currentUser = null
    this.notifyListeners()
  }
  
  /**
   * Získá aktuálního uživatele
   */
  getCurrentUser(): User | null {
    return this.currentUser
  }
  
  /**
   * Subscribe to auth changes
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.currentUser))
  }
  
  /**
   * Získá profil uživatele z DB
   */
  private async getUser(userId: string): Promise<User | null> {
    if (!this.config) return null
    
    const sessionData = localStorage.getItem('supabase-session')
    const token = sessionData ? JSON.parse(sessionData).access_token : this.config.anonKey
    
    try {
      const response = await fetch(
        `${this.config.url}/rest/v1/user_profiles?id=eq.${userId}`,
        {
          headers: {
            apikey: this.config.anonKey,
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      const data = await response.json()
      
      if (data && data.length > 0) {
        const profile = data[0]
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatar_url,
          createdAt: new Date(profile.created_at),
          storageUsed: profile.storage_used || 0,
          storageLimit: STORAGE_LIMITS[profile.plan as keyof typeof STORAGE_LIMITS] || STORAGE_LIMITS.free,
          plan: profile.plan || 'free',
        }
      }
      
      return null
    } catch {
      return null
    }
  }
  
  /**
   * Vytvoří profil uživatele
   */
  private async createUserProfile(user: User): Promise<boolean> {
    if (!this.config) return false
    
    const sessionData = localStorage.getItem('supabase-session')
    const token = sessionData ? JSON.parse(sessionData).access_token : this.config.anonKey
    
    try {
      const response = await fetch(`${this.config.url}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.anonKey,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatarUrl,
          storage_used: 0,
          plan: 'free',
        }),
      })
      
      return response.ok
    } catch {
      return false
    }
  }
  
  // ===========================================================================
  // STORAGE
  // ===========================================================================
  
  /**
   * Nahraje soubor do user storage
   */
  async uploadFile(
    file: File | Blob,
    path: string,
    contentType?: string
  ): Promise<StorageResult> {
    if (!this.config || !this.currentUser) {
      return { success: false, error: 'Uživatel není přihlášen' }
    }
    
    const sessionData = localStorage.getItem('supabase-session')
    if (!sessionData) {
      return { success: false, error: 'Session expired' }
    }
    
    const { access_token } = JSON.parse(sessionData)
    const fileSize = file.size
    
    // Check storage limit
    if (this.currentUser.storageUsed + fileSize > this.currentUser.storageLimit) {
      return { success: false, error: 'Překročen limit úložiště' }
    }
    
    const fullPath = `${this.currentUser.id}/${path}`
    
    try {
      const response = await fetch(
        `${this.config.url}/storage/v1/object/user-files/${fullPath}`,
        {
          method: 'POST',
          headers: {
            apikey: this.config.anonKey,
            Authorization: `Bearer ${access_token}`,
            'Content-Type': contentType || file.type || 'application/octet-stream',
          },
          body: file,
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.message || 'Upload failed' }
      }
      
      // Update storage used
      this.currentUser.storageUsed += fileSize
      await this.updateStorageUsed(this.currentUser.id, this.currentUser.storageUsed)
      
      // Get public URL
      const publicUrl = `${this.config.url}/storage/v1/object/public/user-files/${fullPath}`
      
      return {
        success: true,
        url: publicUrl,
        path: fullPath,
        sizeBytes: fileSize,
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Smaže soubor
   */
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    if (!this.config || !this.currentUser) {
      return { success: false, error: 'Uživatel není přihlášen' }
    }
    
    const sessionData = localStorage.getItem('supabase-session')
    if (!sessionData) {
      return { success: false, error: 'Session expired' }
    }
    
    const { access_token } = JSON.parse(sessionData)
    
    try {
      const response = await fetch(
        `${this.config.url}/storage/v1/object/user-files/${path}`,
        {
          method: 'DELETE',
          headers: {
            apikey: this.config.anonKey,
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      
      return { success: response.ok }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Vrátí seznam souborů uživatele
   */
  async listFiles(prefix?: string): Promise<{ files: any[]; error?: string }> {
    if (!this.config || !this.currentUser) {
      return { files: [], error: 'Uživatel není přihlášen' }
    }
    
    const sessionData = localStorage.getItem('supabase-session')
    if (!sessionData) {
      return { files: [], error: 'Session expired' }
    }
    
    const { access_token } = JSON.parse(sessionData)
    const searchPath = prefix ? `${this.currentUser.id}/${prefix}` : this.currentUser.id
    
    try {
      const response = await fetch(
        `${this.config.url}/storage/v1/object/list/user-files`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.anonKey,
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ prefix: searchPath }),
        }
      )
      
      const data = await response.json()
      return { files: data || [] }
    } catch (error: any) {
      return { files: [], error: error.message }
    }
  }
  
  private async updateStorageUsed(userId: string, bytes: number): Promise<void> {
    if (!this.config) return
    
    const sessionData = localStorage.getItem('supabase-session')
    if (!sessionData) return
    
    const { access_token } = JSON.parse(sessionData)
    
    try {
      await fetch(
        `${this.config.url}/rest/v1/user_profiles?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.anonKey,
            Authorization: `Bearer ${access_token}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ storage_used: bytes }),
        }
      )
    } catch {
      // Silent fail
    }
  }
  
  // ===========================================================================
  // USER DATA (Creatives, Brand Kits sync)
  // ===========================================================================
  
  /**
   * Uloží uživatelská data (kreativy, brand kity, atd.)
   */
  async saveUserData(key: string, data: any): Promise<{ success: boolean; error?: string }> {
    if (!this.config || !this.currentUser) {
      return { success: false, error: 'Uživatel není přihlášen' }
    }
    
    const sessionData = localStorage.getItem('supabase-session')
    if (!sessionData) {
      return { success: false, error: 'Session expired' }
    }
    
    const { access_token } = JSON.parse(sessionData)
    
    try {
      // Upsert
      const response = await fetch(
        `${this.config.url}/rest/v1/user_data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.anonKey,
            Authorization: `Bearer ${access_token}`,
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            user_id: this.currentUser.id,
            key,
            data,
            updated_at: new Date().toISOString(),
          }),
        }
      )
      
      return { success: response.ok }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Načte uživatelská data
   */
  async loadUserData(key: string): Promise<{ data: any; error?: string }> {
    if (!this.config || !this.currentUser) {
      return { data: null, error: 'Uživatel není přihlášen' }
    }
    
    const sessionData = localStorage.getItem('supabase-session')
    if (!sessionData) {
      return { data: null, error: 'Session expired' }
    }
    
    const { access_token } = JSON.parse(sessionData)
    
    try {
      const response = await fetch(
        `${this.config.url}/rest/v1/user_data?user_id=eq.${this.currentUser.id}&key=eq.${key}&select=data`,
        {
          headers: {
            apikey: this.config.anonKey,
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      
      const result = await response.json()
      return { data: result?.[0]?.data || null }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  }
}

// Singleton instance
export const supabase = new SupabaseClientWrapper()

// =============================================================================
// HELPER HOOKS
// =============================================================================

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function getStoragePercentage(used: number, limit: number): number {
  return Math.min(100, Math.round((used / limit) * 100))
}
