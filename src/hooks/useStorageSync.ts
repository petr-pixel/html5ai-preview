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
  const previousCreativesLength = useRef(creatives.length)
  const previousBrandKitsJSON = useRef(JSON.stringify(brandKits))

  // Load data on mount when storage is ready
  useEffect(() => {
    if (isLoading || !isConfigured || isInitialized.current) return
    
    const loadData = async () => {
      try {
        // Load creatives from cloud
        const loadedCreatives = await loadCreatives()
        if (loadedCreatives.length > 0 && creatives.length === 0) {
          addCreatives(loadedCreatives)
        }
        
        // Load brand kits from cloud
        const loadedKits = await loadBrandKits()
        if (loadedKits.length > 0 && brandKits.length === 0) {
          setBrandKits(loadedKits)
        }
        
        isInitialized.current = true
        previousCreativesLength.current = loadedCreatives.length || creatives.length
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
    
    // Check if new creatives were added
    if (creatives.length > previousCreativesLength.current) {
      const newCount = creatives.length - previousCreativesLength.current
      const newCreatives = creatives.slice(0, newCount)
      
      // Save each new creative
      newCreatives.forEach(creative => {
        saveCreative(creative).catch(err => 
          console.error('Failed to save creative:', err)
        )
      })
    }
    
    previousCreativesLength.current = creatives.length
  }, [creatives.length, isConfigured, isLoading])

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
