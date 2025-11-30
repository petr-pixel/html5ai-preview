import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AppState, TextOverlay, Watermark, QRCode, ABVariant, PlatformId, VideoScenario, SourceImageVariant, FormatOutputSettings, BrandKit } from '@/types'

const defaultTextOverlay: TextOverlay = {
  enabled: false,
  headline: '',
  subheadline: '',
  cta: 'Zjistit více',
  position: 'bottom-left',
  ctaColor: '#f97316',
  fontSize: 'medium',
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
            state.creatives[c.id] = c
          })
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

      // R2 Storage Config
      r2Config: null,
      setR2Config: (config) =>
        set((state) => {
          state.r2Config = state.r2Config 
            ? { ...state.r2Config, ...config }
            : { accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '', publicUrl: '', ...config }
        }),

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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        r2Config: state.r2Config,
        history: state.history,
        textOverlay: state.textOverlay,
        watermark: state.watermark,
        qrCode: state.qrCode,
        videoScenario: state.videoScenario,
        abVariants: state.abVariants,
        brandKits: state.brandKits,
        activeBrandKit: state.activeBrandKit,
        textModelTier: state.textModelTier,
        imageModelTier: state.imageModelTier,
        videoModelTier: state.videoModelTier,
      }),
    }
  )
)
