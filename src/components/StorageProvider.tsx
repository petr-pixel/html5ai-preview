/**
 * Storage Provider - Cloud storage s Supabase
 * 
 * Supabase Free Tier (sdílené pro celý projekt):
 * - Storage: 1 GB
 * - Database: 500 MB
 * - Bandwidth: 5 GB/měsíc
 * 
 * Per-user limit nastavený v databázi (storage_limit v user_profiles)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/components/Auth'
import {
  saveUserData,
  loadUserData,
  saveCreative as saveCreativeToSupabase,
  loadCreatives as loadCreativesFromSupabase,
  deleteCreative as deleteCreativeFromSupabase,
  uploadFile,
  getUserProfile,
  formatStorageSize,
  getStoragePercentage,
  isSupabaseConfigured,
} from '@/lib/supabase'
import {
  Cloud,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { Creative, BrandKit } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface StorageStats {
  creativesCount: number
  storageUsed: number
  storageLimit: number
  percentage: number
}

interface StorageContextType {
  stats: StorageStats
  isLoading: boolean
  isSyncing: boolean
  isConfigured: boolean
  
  // Creative operations
  saveCreative: (creative: Creative) => Promise<boolean>
  loadCreatives: () => Promise<Creative[]>
  deleteCreative: (id: string) => Promise<boolean>
  
  // Brand Kit operations
  saveBrandKits: (kits: BrandKit[]) => Promise<boolean>
  loadBrandKits: () => Promise<BrandKit[]>
  
  // Settings operations
  saveSettings: (key: string, data: any) => Promise<boolean>
  loadSettings: <T>(key: string) => Promise<T | null>
  
  // Image upload
  uploadImage: (file: File | Blob, filename?: string) => Promise<string | null>
  
  // Refresh stats
  refreshStats: () => Promise<void>
}

const StorageContext = createContext<StorageContextType | null>(null)

export function useStorage() {
  const context = useContext(StorageContext)
  if (!context) {
    throw new Error('useStorage must be used within StorageProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface StorageProviderProps {
  children: ReactNode
}

export function StorageProvider({ children }: StorageProviderProps) {
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [stats, setStats] = useState<StorageStats>({
    creativesCount: 0,
    storageUsed: 0,
    storageLimit: 104857600, // 100 MB default per user
    percentage: 0,
  })

  const isConfigured = isSupabaseConfigured()

  // Update stats from profile
  useEffect(() => {
    if (profile) {
      const used = profile.storage_used || 0
      const limit = profile.storage_limit || 104857600
      setStats({
        creativesCount: 0, // Will be updated when creatives are loaded
        storageUsed: used,
        storageLimit: limit,
        percentage: getStoragePercentage(used, limit),
      })
    }
    setIsLoading(false)
  }, [profile])

  const refreshStats = async () => {
    if (!user) return
    
    const userProfile = await getUserProfile(user.id)
    if (userProfile) {
      const used = userProfile.storage_used || 0
      const limit = userProfile.storage_limit || 104857600
      setStats(prev => ({
        ...prev,
        storageUsed: used,
        storageLimit: limit,
        percentage: getStoragePercentage(used, limit),
      }))
    }
  }

  // ============================================================================
  // CREATIVE OPERATIONS
  // ============================================================================

  const saveCreative = async (creative: Creative): Promise<boolean> => {
    if (!user || !isConfigured) {
      console.warn('Cannot save: user not logged in or Supabase not configured')
      return false
    }
    
    setIsSyncing(true)
    
    try {
      let imageUrl = creative.imageUrl
      let fileSize = 0
      
      // Upload image to Supabase Storage if it's base64
      if (creative.imageUrl.startsWith('data:')) {
        const response = await fetch(creative.imageUrl)
        const blob = await response.blob()
        fileSize = blob.size
        
        const uploadedUrl = await uploadFile(user.id, blob as File, `creatives/${creative.id}.png`)
        
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          console.error('Failed to upload image')
          return false
        }
      }
      
      const id = await saveCreativeToSupabase(user.id, {
        name: creative.format?.name || 'Creative',
        platform: creative.platform,
        category: creative.category,
        format_key: creative.formatKey,
        width: creative.format?.width || 0,
        height: creative.format?.height || 0,
        file_url: imageUrl,
        thumbnail_url: imageUrl,
        file_size: fileSize,
        metadata: {
          prompt: creative.prompt,
          textLayer: creative.textLayer,
          isSource: creative.isSource,
        }
      })
      
      if (id) {
        // Update storage stats
        await refreshStats()
        setStats(prev => ({ ...prev, creativesCount: prev.creativesCount + 1 }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error saving creative:', error)
      return false
    } finally {
      setIsSyncing(false)
    }
  }

  const loadCreatives = async (): Promise<Creative[]> => {
    if (!user || !isConfigured) return []
    
    try {
      const cloudCreatives = await loadCreativesFromSupabase(user.id)
      
      const mapped = cloudCreatives.map(c => ({
        id: c.id,
        formatKey: c.format_key,
        platform: c.platform as any,
        category: c.category,
        format: {
          width: c.width,
          height: c.height,
          name: c.name,
        },
        imageUrl: c.file_url,
        createdAt: new Date(c.created_at),
        prompt: c.metadata?.prompt,
        textLayer: c.metadata?.textLayer,
        isSource: c.metadata?.isSource,
      }))
      
      setStats(prev => ({ ...prev, creativesCount: mapped.length }))
      
      return mapped
    } catch (error) {
      console.error('Error loading creatives:', error)
      return []
    }
  }

  const deleteCreative = async (id: string): Promise<boolean> => {
    if (!user || !isConfigured) return false
    
    try {
      const success = await deleteCreativeFromSupabase(id)
      if (success) {
        await refreshStats()
        setStats(prev => ({ ...prev, creativesCount: Math.max(0, prev.creativesCount - 1) }))
      }
      return success
    } catch (error) {
      console.error('Error deleting creative:', error)
      return false
    }
  }

  // ============================================================================
  // BRAND KIT OPERATIONS
  // ============================================================================

  const saveBrandKits = async (kits: BrandKit[]): Promise<boolean> => {
    if (!user || !isConfigured) return false
    return await saveUserData(user.id, 'brand_kits', kits)
  }

  const loadBrandKits = async (): Promise<BrandKit[]> => {
    if (!user || !isConfigured) return []
    const kits = await loadUserData<BrandKit[]>(user.id, 'brand_kits')
    return kits || []
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  const saveSettings = async (key: string, data: any): Promise<boolean> => {
    if (!user || !isConfigured) return false
    return await saveUserData(user.id, `settings_${key}`, data)
  }

  const loadSettings = async <T>(key: string): Promise<T | null> => {
    if (!user || !isConfigured) return null
    return await loadUserData<T>(user.id, `settings_${key}`)
  }

  // ============================================================================
  // IMAGE UPLOAD
  // ============================================================================

  const uploadImage = async (file: File | Blob, filename?: string): Promise<string | null> => {
    if (!user || !isConfigured) return null
    
    const name = filename || `images/${Date.now()}.png`
    return await uploadFile(user.id, file as File, name)
  }

  const contextValue: StorageContextType = {
    stats,
    isLoading,
    isSyncing,
    isConfigured,
    saveCreative,
    loadCreatives,
    deleteCreative,
    saveBrandKits,
    loadBrandKits,
    saveSettings,
    loadSettings,
    uploadImage,
    refreshStats,
  }

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  )
}

// ============================================================================
// STORAGE STATUS BAR
// ============================================================================

export function StorageStatusBar() {
  const { stats, isSyncing, isConfigured } = useStorage()
  
  if (!isConfigured) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-yellow-200">Storage není nakonfigurován</span>
      </div>
    )
  }
  
  const isNearLimit = stats.percentage > 80
  const isOverLimit = stats.percentage > 95
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
      <div className="relative">
        <Cloud className={`w-4 h-4 ${isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-blue-400'}`} />
        {isSyncing && (
          <Loader2 className="w-3 h-3 text-blue-400 animate-spin absolute -top-1 -right-1" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-white/60">
            {stats.creativesCount} kreativ
          </span>
          <span className={isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white/40'}>
            {formatStorageSize(stats.storageUsed)} / {formatStorageSize(stats.storageLimit)}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, stats.percentage)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STORAGE WARNING BANNER (zobrazí se když je blízko limitu)
// ============================================================================

export function StorageWarningBanner() {
  const { stats, isConfigured } = useStorage()
  
  if (!isConfigured || stats.percentage < 80) return null
  
  const isOverLimit = stats.percentage > 95
  
  return (
    <div className={`px-4 py-2 ${isOverLimit ? 'bg-red-500/20' : 'bg-yellow-500/20'} border-b ${isOverLimit ? 'border-red-500/30' : 'border-yellow-500/30'}`}>
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <AlertTriangle className={`w-4 h-4 ${isOverLimit ? 'text-red-400' : 'text-yellow-400'}`} />
        <span className={`text-sm ${isOverLimit ? 'text-red-200' : 'text-yellow-200'}`}>
          {isOverLimit 
            ? 'Dosáhli jste limitu úložiště! Smažte některé kreativy nebo upgradujte.'
            : `Blížíte se limitu úložiště (${stats.percentage}%). Zvažte upgrade nebo smazání starých kreativ.`
          }
        </span>
        <button className={`ml-auto px-3 py-1 rounded-lg text-xs font-medium ${
          isOverLimit ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
        }`}>
          Upgrade
        </button>
      </div>
    </div>
  )
}
