/**
 * useUsageLimits - Hook pro sledování a kontrolu usage limitů
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/Auth'
import { getUsageStats, trackUsage, canUseAction, type UsageStats, type ActionType, type TrackResult } from '@/lib/supabase'

interface UseUsageLimitsReturn {
  stats: UsageStats | null
  loading: boolean
  
  // Check if action is allowed
  checkLimit: (action: ActionType) => Promise<{ allowed: boolean; remaining: number; message?: string }>
  
  // Track usage and check limit in one call
  useAction: (action: ActionType) => Promise<TrackResult>
  
  // Refresh stats
  refresh: () => Promise<void>
  
  // Get remaining for specific action
  getRemaining: (action: ActionType) => number
  
  // Is user on free plan?
  isFreePlan: boolean
}

export function useUsageLimits(): UseUsageLimitsReturn {
  const { user } = useAuth()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setStats(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    const data = await getUsageStats(user.id)
    setStats(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const checkLimit = useCallback(async (action: ActionType) => {
    if (!user) return { allowed: false, remaining: 0, message: 'Nejste přihlášeni' }
    
    const { allowed, remaining, limit } = await canUseAction(action, user.id)
    
    if (!allowed) {
      const actionNames: Record<ActionType, string> = {
        ai_image: 'AI generování obrázků',
        ai_copy: 'AI copywriting',
        ai_resize: 'AI resize',
        export: 'export'
      }
      
      return {
        allowed: false,
        remaining: 0,
        message: `Dosáhli jste denního limitu pro ${actionNames[action]} (${limit}). Upgradujte na Pro pro neomezené použití.`
      }
    }
    
    return { allowed: true, remaining }
  }, [user])

  const useAction = useCallback(async (action: ActionType): Promise<TrackResult> => {
    if (!user) return { success: false, error: 'Nejste přihlášeni' }
    
    const result = await trackUsage(action)
    
    // Refresh stats after action
    if (result.success) {
      refresh()
    }
    
    return result
  }, [user, refresh])

  const getRemaining = useCallback((action: ActionType): number => {
    if (!stats) return -1
    
    switch (action) {
      case 'ai_image': return stats.remaining.ai_image
      case 'ai_copy': return stats.remaining.ai_copy
      case 'ai_resize': return stats.remaining.ai_resize
      case 'export': return stats.remaining.export
      default: return -1
    }
  }, [stats])

  const isFreePlan = stats?.plan === 'free' || !stats

  return {
    stats,
    loading,
    checkLimit,
    useAction,
    refresh,
    getRemaining,
    isFreePlan,
  }
}
