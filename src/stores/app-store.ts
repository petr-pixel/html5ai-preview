import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, BrandKit, TextOverlay, FormatSettings, Creative, VideoSettings, Html5Settings, PlatformId } from '@/types'
import { getRecommendedFormats } from '@/lib/formats'

const defaultTextOverlay: TextOverlay = {
  headline: '',
  subheadline: '',
  cta: '',
  position: 'bottom-center',
  fontSize: 24,
  fontFamily: 'Inter, sans-serif',
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.7)',
  showHeadline: true,
  showSubheadline: true,
  showCta: true,
}

const defaultBrandKit: BrandKit = {
  logo: null,
  logoDark: null,
  logoLight: null,
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  fontFamily: 'Inter, sans-serif',
  tagline: '',
  description: '',
  sourceUrl: null,
}

const defaultVideoSettings: VideoSettings = {
  duration: 15,
  aspectRatio: '16:9',
  tier: 'slideshow',
  prompt: '',
  kenBurns: true,
}

const defaultHtml5Settings: Html5Settings = {
  template: 'fade-in',
  animationDuration: 1,
  loop: true,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // API
      apiKey: '',
      setApiKey: (apiKey) => set({ apiKey }),
      
      // Source
      sourceImage: null,
      setSourceImage: (sourceImage) => set({ sourceImage }),
      sourcePrompt: '',
      setSourcePrompt: (sourcePrompt) => set({ sourcePrompt }),
      
      // Platform & Formats
      activePlatform: 'all',
      setActivePlatform: (activePlatform) => set({ activePlatform }),
      selectedFormats: new Set<string>(),
      toggleFormat: (formatId) => set((state) => {
        const newSet = new Set(state.selectedFormats)
        if (newSet.has(formatId)) {
          newSet.delete(formatId)
        } else {
          newSet.add(formatId)
        }
        return { selectedFormats: newSet }
      }),
      selectRecommended: () => set((state) => {
        const platform = state.activePlatform === 'all' ? undefined : state.activePlatform as PlatformId
        const recommended = getRecommendedFormats(platform)
        return { selectedFormats: new Set(recommended.map(f => f.id)) }
      }),
      clearSelection: () => set({ selectedFormats: new Set() }),
      
      // Brand Kit
      brandKit: defaultBrandKit,
      setBrandKit: (kit) => set((state) => ({
        brandKit: { ...state.brandKit, ...kit }
      })),
      
      // Text (global default)
      defaultText: defaultTextOverlay,
      setDefaultText: (text) => set((state) => ({
        defaultText: { ...state.defaultText, ...text }
      })),
      
      // Per-format settings
      formatSettings: {},
      setFormatSettings: (formatId, settings) => set((state) => ({
        formatSettings: {
          ...state.formatSettings,
          [formatId]: {
            ...state.formatSettings[formatId],
            ...settings,
          }
        }
      })),
      
      // Creatives
      creatives: [],
      addCreative: (creative) => set((state) => ({
        creatives: [...state.creatives, creative]
      })),
      updateCreative: (id, updates) => set((state) => ({
        creatives: state.creatives.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      clearCreatives: () => set({ creatives: [] }),
      
      // Video
      videoSettings: defaultVideoSettings,
      setVideoSettings: (settings) => set((state) => ({
        videoSettings: { ...state.videoSettings, ...settings }
      })),
      
      // HTML5
      html5Settings: defaultHtml5Settings,
      setHtml5Settings: (settings) => set((state) => ({
        html5Settings: { ...state.html5Settings, ...settings }
      })),
      
      // UI State
      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      progress: 0,
      setProgress: (progress) => set({ progress }),
      activeTab: 'input',
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'adcreative-studio',
      partialize: (state) => ({
        apiKey: state.apiKey,
        brandKit: state.brandKit,
        defaultText: state.defaultText,
        videoSettings: state.videoSettings,
        html5Settings: state.html5Settings,
      }),
    }
  )
)
