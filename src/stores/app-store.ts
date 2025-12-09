import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AppState, TextOverlay, Watermark, QRCode, ABVariant, PlatformId, VideoScenario, SourceImageVariant, FormatOutputSettings, BrandKit, TextLayer } from '@/types'

// Custom storage s error handling a logging
const customStorage: StateStorage = {
  getItem: (name) => {
    try {
      const value = localStorage.getItem(name)
      if (value) {
        console.log(`📖 localStorage: Loaded "${name}" (${(value.length / 1024).toFixed(1)} KB)`)
      }
      return value
    } catch (error) {
      console.error('❌ localStorage getItem error:', error)
      return null
    }
  },
  setItem: (name, value) => {
    try {
      const sizeKB = value.length / 1024
      const sizeMB = sizeKB / 1024

      // Varování pokud je příliš velké
      if (sizeMB > 4) {
        console.warn(`⚠️ localStorage: Data too large (${sizeMB.toFixed(2)} MB). May fail!`)
      }

      localStorage.setItem(name, value)
      console.log(`💾 localStorage: Saved "${name}" (${sizeKB.toFixed(1)} KB)`)
    } catch (error) {
      console.error('❌ localStorage setItem error:', error)
      // Pokud je quota exceeded, zkusit vyčistit staré věci
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('🗑️ localStorage full! Consider using Supabase for cloud storage.')
      }
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
      console.log(`🗑️ localStorage: Removed "${name}"`)
    } catch (error) {
      console.error('❌ localStorage removeItem error:', error)
    }
  },
}

const defaultTextOverlay: TextOverlay = {
  enabled: false,
  headline: '',
  subheadline: '',
  cta: 'Zjistit více',
  position: 'bottom-left',
  ctaColor: '#f97316',
  fontSize: 'medium',
  shadow: {
    enabled: false,
    color: 'rgba(0,0,0,0.8)',
    blur: 4,
    offsetX: 2,
    offsetY: 2,
  },
}

const defaultWatermark: Watermark = {
  enabled: false,
  image: null,
  position: 'bottom-right',
  opacity: 0.8,
  size: 15,
}

const defaultQRCode: QRCode = {
  enabled: false,
  url: '',
  position: 'bottom-right',
  size: 80,
  margin: 20,
}


const defaultVideoScenario: VideoScenario = {
  campaignType: 'pmax',
  lengthSeconds: 15,
  aspectRatio: '16:9',
  language: 'cs',
  style: 'realistic',
  hook: '',
  body: '',
  proof: '',
  cta: '',
  voiceoverText: '',
  subtitles: true,
  fromImage: false,
}

const defaultABVariants: ABVariant[] = [
  { id: 'A', headline: '', subheadline: '', cta: 'Zjistit více', ctaColor: '#f97316' },
  { id: 'B', headline: '', subheadline: '', cta: 'Koupit nyní', ctaColor: '#22c55e' },
  { id: 'C', headline: '', subheadline: '', cta: 'Objednat', ctaColor: '#3b82f6' },
]

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      // Platform & Category
      platform: 'sklik' as PlatformId,
      category: 'kombinovana',
      setPlatform: (platform) => set({ platform, category: platform === 'sklik' ? 'kombinovana' : 'pmax' }),
      setCategory: (category) => set({ category }),

      // Source
      prompt: '',
      sourceFormat: 'landscape',
      sourceImage: null,
      sourceVariants: [] as SourceImageVariant[],
      activeSourceVariant: null as string | null,
      cropMode: 'smart' as 'smart' | 'fit', // smart = Smart Crop, fit = zachovat celý obrázek
      formatOffsets: {} as Record<string, { x: number; y: number }>,  // Per-format posun v procentech
      setPrompt: (prompt) => set({ prompt }),
      setSourceFormat: (format) => set({ sourceFormat: format }),
      setSourceImage: (image) => set({ sourceImage: image, formatOffsets: {} }), // Reset offsets při novém obrázku
      setCropMode: (mode) => set({ cropMode: mode }),
      setFormatOffset: (formatKey, offset) => set((state) => {
        state.formatOffsets[formatKey] = offset
      }),
      resetFormatOffsets: () => set({ formatOffsets: {} }),
      setSourceVariants: (variants) => set({ sourceVariants: variants }),
      addSourceVariant: (variant) =>
        set((state) => {
          state.sourceVariants.push(variant)
          if (!state.activeSourceVariant) {
            state.activeSourceVariant = variant.id
            state.sourceImage = variant.imageUrl
          }
        }),
      setActiveSourceVariant: (id) =>
        set((state) => {
          state.activeSourceVariant = id
          const variant = state.sourceVariants.find((v) => v.id === id)
          if (variant) {
            state.sourceImage = variant.imageUrl
          }
        }),

      // Format output settings (per-format crop, HTML5 toggle)
      formatOutputSettings: {} as Record<string, FormatOutputSettings>,
      setFormatOutputSettings: (key, settings) =>
        set((state) => {
          if (!state.formatOutputSettings[key]) {
            state.formatOutputSettings[key] = { formatKey: key, outputType: 'static' }
          }
          state.formatOutputSettings[key] = { ...state.formatOutputSettings[key], ...settings }
        }),

      // Selection
      selectedFormats: new Set<string>(),
      toggleFormat: (key) =>
        set((state) => {
          const newSet = new Set(state.selectedFormats)
          if (newSet.has(key)) {
            newSet.delete(key)
          } else {
            newSet.add(key)
          }
          state.selectedFormats = newSet
        }),
      selectAllFormats: (keys) =>
        set((state) => {
          const newSet = new Set(state.selectedFormats)
          keys.forEach((key) => newSet.add(key))
          state.selectedFormats = newSet
        }),
      clearSelection: () => set({ selectedFormats: new Set() }),

      // Creatives
      creatives: {},
      addCreatives: (creatives) =>
        set((state) => {
          creatives.forEach((c) => {
            // Zajistit že createdAt je string pro serializaci
            const creative = {
              ...c,
              createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt
            }
            state.creatives[c.id] = creative as any
          })
          console.log(`📦 Store: Added ${creatives.length} creatives. Total: ${Object.keys(state.creatives).length}`)
        }),
      deleteCreative: (id) =>
        set((state) => {
          delete state.creatives[id]
        }),
      deleteCreatives: (ids) =>
        set((state) => {
          ids.forEach((id) => {
            delete state.creatives[id]
          })
        }),
      clearCreatives: () => set({ creatives: {} }),

      // Text Overlay
      textOverlay: defaultTextOverlay,
      setTextOverlay: (overlay) =>
        set((state) => {
          state.textOverlay = { ...state.textOverlay, ...overlay }
        }),

      // Per-format text settings
      perFormatTextSettings: {} as Record<string, { fontSizeMultiplier: number; hideHeadline?: boolean; hideSubheadline?: boolean; hideCta?: boolean; customPosition?: string }>,
      setPerFormatTextSettings: (formatKey, settings) =>
        set((state) => {
          if (!state.perFormatTextSettings[formatKey]) {
            state.perFormatTextSettings[formatKey] = { fontSizeMultiplier: 1.0 }
          }
          state.perFormatTextSettings[formatKey] = { ...state.perFormatTextSettings[formatKey], ...settings }
        }),
      resetPerFormatTextSettings: () => set({ perFormatTextSettings: {} }),

      // Per-format text layers (kompletní pozice a nastavení textů)
      perFormatTextLayers: {} as Record<string, TextLayer>,
      setPerFormatTextLayer: (formatKey: string, textLayer: TextLayer) =>
        set((state) => {
          state.perFormatTextLayers[formatKey] = JSON.parse(JSON.stringify(textLayer))
        }),
      clearPerFormatTextLayer: (formatKey: string) =>
        set((state) => {
          delete state.perFormatTextLayers[formatKey]
        }),
      clearAllPerFormatTextLayers: () => set({ perFormatTextLayers: {} }),

      // Outpainted images per format
      outpaintedImages: {} as Record<string, string>,
      setOutpaintedImage: (formatKey, imageUrl) =>
        set((state) => {
          state.outpaintedImages[formatKey] = imageUrl
        }),
      clearOutpaintedImage: (formatKey) =>
        set((state) => {
          delete state.outpaintedImages[formatKey]
        }),
      clearAllOutpaintedImages: () => set({ outpaintedImages: {} }),

      // Watermark
      watermark: defaultWatermark,
      setWatermark: (watermark) =>
        set((state) => {
          state.watermark = { ...state.watermark, ...watermark }
        }),

      // QR Code
      qrCode: defaultQRCode,
      setQRCode: (qrCode) =>
        set((state) => {
          state.qrCode = { ...state.qrCode, ...qrCode }
        }),

      // Video Scenario
      videoScenario: defaultVideoScenario,
      setVideoScenario: (scenario) =>
        set((state) => {
          state.videoScenario = { ...state.videoScenario, ...scenario }
        }),

      // A/B Testing
      abVariants: defaultABVariants,
      activeVariant: 'A',
      setABVariants: (variants) => set({ abVariants: variants }),
      setActiveVariant: (variant) => set({ activeVariant: variant }),

      // Brand Kit
      brandKits: [] as BrandKit[],
      activeBrandKit: null as string | null,
      setBrandKits: (kits) => set({ brandKits: kits }),
      addBrandKit: (kit) =>
        set((state) => {
          state.brandKits.push(kit)
        }),
      setActiveBrandKit: (id) => set({ activeBrandKit: id }),

      // History
      history: [],
      addToHistory: (item) =>
        set((state) => {
          state.history.unshift(item)
          // Keep only last 50 items
          if (state.history.length > 50) {
            state.history = state.history.slice(0, 50)
          }
        }),
      clearHistory: () => set({ history: [] }),
      loadFromHistory: (item) =>
        set({
          prompt: item.prompt,
          sourceImage: item.sourceImage,
          sourceVariants: item.sourceVariants || [],
          textOverlay: item.textOverlay,
          watermark: item.watermark,
          qrCode: item.qrCode,
          platform: item.platform,
        }),

      // API Keys
      apiKeys: {
        openai: '',
      },

      // Model tiers
      textModelTier: 'standard',
      imageModelTier: 'standard',
      videoModelTier: 'standard',
      setTextModelTier: (tier) => set({ textModelTier: tier }),
      setImageModelTier: (tier) => set({ imageModelTier: tier }),
      setVideoModelTier: (tier) => set({ videoModelTier: tier }),
      setApiKeys: (keys) =>
        set((state) => {
          state.apiKeys = { ...state.apiKeys, ...keys }
        }),

      // Supabase config for auth & cloud storage
      supabaseConfig: null as { url: string; anonKey: string } | null,
      setSupabaseConfig: (config: { url: string; anonKey: string } | null) => set({ supabaseConfig: config }),

      // UI State
      isGenerating: false,
      progress: 0,
      activeView: 'create',
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setProgress: (progress) => set({ progress }),
      setActiveView: (view) => set({ activeView: view }),
    })),
    {
      name: 'adcreative-studio',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => {
        // Omezit počet creatives pro localStorage (max 20)
        const creativesEntries = Object.entries(state.creatives)
        const limitedCreatives: Record<string, any> = {}

        // Vzít jen posledních 20 kreativ podle ID (které obsahuje timestamp)
        const sortedEntries = creativesEntries.sort((a, b) => {
          const timeA = parseInt(a[0].split('-').pop() || '0')
          const timeB = parseInt(b[0].split('-').pop() || '0')
          return timeB - timeA
        }).slice(0, 20)

        sortedEntries.forEach(([id, creative]) => {
          limitedCreatives[id] = creative
        })

        if (creativesEntries.length > 20) {
          console.warn(`⚠️ Omezeno na 20 kreativ pro localStorage (bylo ${creativesEntries.length})`)
        }

        return {
          // API & Config
          apiKeys: state.apiKeys,
          supabaseConfig: (state as any).supabaseConfig,

          // Creatives - max 20
          creatives: limitedCreatives,

          // Per-format settings
          perFormatTextLayers: state.perFormatTextLayers,
          perFormatTextSettings: state.perFormatTextSettings,
          formatOffsets: state.formatOffsets,
          formatOutputSettings: state.formatOutputSettings,
          outpaintedImages: state.outpaintedImages,

          // Source
          sourceImage: state.sourceImage,
          sourceVariants: state.sourceVariants,
          activeSourceVariant: state.activeSourceVariant,

          // Text & Overlays
          textOverlay: state.textOverlay,
          watermark: state.watermark,
          qrCode: state.qrCode,

          // Branding
          brandKits: state.brandKits,
          activeBrandKit: state.activeBrandKit,

          // AI Model settings
          textModelTier: state.textModelTier,
          imageModelTier: state.imageModelTier,
          videoModelTier: state.videoModelTier,

          // Video
          videoScenario: state.videoScenario,

          // A/B Testing
          abVariants: state.abVariants,

          // History - max 5
          history: state.history.slice(-5),

          // Platform & Category selection
          platform: state.platform,
          category: state.category,
        }
      },
      // Debug: sledovat co se děje při rehydraci
      onRehydrateStorage: () => {
        console.log('🔄 Zustand: Starting rehydration from localStorage...')
        return (state, error) => {
          if (error) {
            console.error('❌ Zustand: Rehydration failed:', error)
          } else {
            const creativesCount = state ? Object.keys(state.creatives || {}).length : 0
            console.log(`✅ Zustand: Rehydrated! Creatives: ${creativesCount}`)
          }
        }
      },
    }
  )
)
