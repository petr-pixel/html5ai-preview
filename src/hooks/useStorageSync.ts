/**
 * useStorageSync - Synchronizuje Zustand store se StorageProvider
 * 
 * Při změně creatives nebo brandKits v store automaticky uloží do cloud storage
 * Při načtení aplikace načte data ze storage do store
 */

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useStorage } from '@/components/StorageProvider'
import type { Creative, BrandKit } from '@/types'

export function useStorageSync() {
  const { 
    creatives, 
    brandKits,
    addCreatives,
    setBrandKits,
  } = useAppStore()
  
  const {
    isLoading,
    isConfigured,
    saveCreative,
    loadCreatives,
    saveBrandKits,
    loadBrandKits,
  } = useStorage()
  
  const isInitialized = useRef(false)
  // FIX: creatives je objekt Record<string, Creative>, ne pole!
  const creativesArray = Object.values(creatives) as Creative[]
  const previousCreativesLength = useRef(0)
  const previousCreativeIds = useRef<Set<string>>(new Set())
  const previousBrandKitsJSON = useRef(JSON.stringify(brandKits))

  // Load data on mount when storage is ready
  useEffect(() => {
    if (isLoading || !isConfigured || isInitialized.current) return
    
    const loadData = async () => {
      try {
        // Load creatives from cloud
        const loadedCreatives = await loadCreatives()
        const currentCount = Object.keys(creatives).length
        if (loadedCreatives.length > 0 && currentCount === 0) {
          addCreatives(loadedCreatives)
        }
        
        // Load brand kits from cloud
        const loadedKits = await loadBrandKits()
        if (loadedKits.length > 0 && brandKits.length === 0) {
          setBrandKits(loadedKits)
        }
        
        isInitialized.current = true
        previousCreativesLength.current = loadedCreatives.length || currentCount
        previousCreativeIds.current = new Set(loadedCreatives.map(c => c.id))
        previousBrandKitsJSON.current = JSON.stringify(loadedKits.length > 0 ? loadedKits : brandKits)
      } catch (error) {
        console.error('Failed to load data from storage:', error)
        isInitialized.current = true // Don't retry on error
      }
    }
    
    loadData()
  }, [isLoading, isConfigured])

  // Auto-save new creatives to cloud
  useEffect(() => {
    if (!isInitialized.current || isLoading || !isConfigured) return
    
    const currentIds = new Set(Object.keys(creatives))
    const currentCount = currentIds.size
    
    // Check if new creatives were added
    if (currentCount > previousCreativesLength.current) {
      // Find new creative IDs
      const newIds = [...currentIds].filter(id => !previousCreativeIds.current.has(id))
      
      // Save each new creative
      newIds.forEach(id => {
        const creative = creatives[id]
        if (creative) {
          saveCreative(creative).catch(err => 
            console.error('Failed to save creative:', err)
          )
        }
      })
    }
    
    previousCreativesLength.current = currentCount
    previousCreativeIds.current = currentIds
  }, [creativesArray.length, isConfigured, isLoading])

  // Auto-save brand kits when changed
  useEffect(() => {
    if (!isInitialized.current || isLoading || !isConfigured) return
    
    const currentJSON = JSON.stringify(brandKits)
    if (currentJSON !== previousBrandKitsJSON.current) {
      saveBrandKits(brandKits).catch(err =>
        console.error('Failed to save brand kits:', err)
      )
      previousBrandKitsJSON.current = currentJSON
    }
  }, [brandKits, isConfigured, isLoading])

  return {
    isInitialized: isInitialized.current,
    isConfigured,
  }
}
