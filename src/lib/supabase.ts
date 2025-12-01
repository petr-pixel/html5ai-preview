/**
 * Supabase Client - Singleton instance
 * 
 * Používá environment variables z Vercelu:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'

// Environment variables (Vite style)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Types
export interface UserProfile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro' | 'enterprise'
  storage_used: number
  storage_limit: number
  is_admin?: boolean
  created_at: string
  updated_at: string
}

export interface Creative {
  id: string
  user_id: string
  name: string
  platform: string
  category: string
  format_key: string
  width: number
  height: number
  file_url: string
  thumbnail_url: string
  file_size: number
  metadata: Record<string, any>
  created_at: string
}

// Singleton client
let supabaseClient: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured - missing environment variables')
    return null
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  
  return supabaseClient
}

// Export pro přímý přístup (např. admin dashboard)
export const supabase = {
  get client() {
    return getClient()
  },
  rpc: async (fn: string, params?: any) => {
    const client = getClient()
    if (!client) throw new Error('Supabase not configured')
    return client.rpc(fn, params)
  }
}

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

export async function signUp(email: string, password: string, name?: string): Promise<{ user: User | null; error: string | null }> {
  const client = getClient()
  if (!client) return { user: null, error: 'Supabase není nakonfigurován' }
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || email.split('@')[0] }
    }
  })
  
  if (error) return { user: null, error: error.message }
  return { user: data.user, error: null }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const client = getClient()
  if (!client) return { user: null, error: 'Supabase není nakonfigurován' }
  
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  
  if (error) return { user: null, error: error.message }
  return { user: data.user, error: null }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const client = getClient()
  if (!client) return { error: 'Supabase není nakonfigurován' }
  
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  })
  
  if (error) return { error: error.message }
  return { error: null }
}

export async function signOut(): Promise<void> {
  const client = getClient()
  if (client) {
    await client.auth.signOut()
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getClient()
  if (!client) return null
  
  const { data: { user } } = await client.auth.getUser()
  return user
}

export async function getSession(): Promise<Session | null> {
  const client = getClient()
  if (!client) return null
  
  const { data: { session } } = await client.auth.getSession()
  return session
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const client = getClient()
  if (!client) return () => {}
  
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  
  return () => subscription.unsubscribe()
}

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const client = getClient()
  if (!client) return null
  
  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  const client = getClient()
  if (!client) return false
  
  const { error } = await client
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating profile:', error)
    return false
  }
  
  return true
}

// ============================================================================
// USER DATA FUNCTIONS (Brand Kits, Settings, etc.)
// ============================================================================

export async function saveUserData(userId: string, key: string, data: any): Promise<boolean> {
  const client = getClient()
  if (!client) return false
  
  const { error } = await client
    .from('user_data')
    .upsert({
      user_id: userId,
      key,
      data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,key'
    })
  
  if (error) {
    console.error('Error saving user data:', error)
    return false
  }
  
  return true
}

export async function loadUserData<T>(userId: string, key: string): Promise<T | null> {
  const client = getClient()
  if (!client) return null
  
  const { data, error } = await client
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .eq('key', key)
    .single()
  
  if (error) {
    if (error.code !== 'PGRST116') { // Not found is OK
      console.error('Error loading user data:', error)
    }
    return null
  }
  
  return data?.data as T
}

// ============================================================================
// CREATIVES FUNCTIONS
// ============================================================================

export async function saveCreative(userId: string, creative: Omit<Creative, 'id' | 'user_id' | 'created_at'>): Promise<string | null> {
  const client = getClient()
  if (!client) return null
  
  const { data, error } = await client
    .from('creatives')
    .insert({
      user_id: userId,
      ...creative
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Error saving creative:', error)
    return null
  }
  
  return data.id
}

export async function loadCreatives(userId: string, limit = 100): Promise<Creative[]> {
  const client = getClient()
  if (!client) return []
  
  const { data, error } = await client
    .from('creatives')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error loading creatives:', error)
    return []
  }
  
  return data || []
}

export async function deleteCreative(creativeId: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false
  
  const { error } = await client
    .from('creatives')
    .delete()
    .eq('id', creativeId)
  
  if (error) {
    console.error('Error deleting creative:', error)
    return false
  }
  
  return true
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

export async function uploadFile(userId: string, file: File, path?: string): Promise<string | null> {
  const client = getClient()
  if (!client) return null
  
  const filePath = path || `${userId}/${Date.now()}-${file.name}`
  
  const { error } = await client.storage
    .from('creatives')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    console.error('Error uploading file:', error)
    return null
  }
  
  const { data } = client.storage
    .from('creatives')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

export async function deleteFile(path: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false
  
  const { error } = await client.storage
    .from('creatives')
    .remove([path])
  
  if (error) {
    console.error('Error deleting file:', error)
    return false
  }
  
  return true
}

// ============================================================================
// UTILITY
// ============================================================================

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function getStoragePercentage(used: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}
