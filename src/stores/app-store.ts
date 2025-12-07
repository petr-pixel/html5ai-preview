import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  BrandKit, 
  TextOverlay, 
  CreativeSettings, 
  Html5Settings, 
  VideoSettings
} from '@/types'

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultBrandKit: BrandKit = {
  id: 'default',
  name: 'Výchozí',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
}

const defaultTextOverlay: TextOverlay = {
  headline: '',
  subheadline: '',
  cta: '',
  showHeadline: true,
  showSubheadline: false,
  showCta: true,
  position: 'bottom-center',
  fontFamily: 'Inter, sans-serif',
  headlineSize: 24,
  headlineColor: '#ffffff',
  headlineBackground: 'rgba(0,0,0,0.7)',
  ctaColor: '#ffffff',
  ctaBackground: '#f59e0b',
}

const defaultHtml5Settings: Html5Settings = {
  template: 'fade-in',
  animationDuration: 1,
  loop: true,
  clickTagUrl: '',
}

const defaultVideoSettings: VideoSettings = {
  tier: 'slideshow',
  aspectRatio: '16:9',
  duration: 15,
  prompt: '',
  kenBurns: true,
  transitions: true,
}

// ============================================================================
// STORE TYPES
// ============================================================================

interface AppState {
  // Settings (persisted)
  apiKey: string
  darkMode: boolean
  
  // Current project
  projectName: string
  sourceImage: string | null
  sourcePrompt: string
  brandKit: BrandKit
  defaultText: TextOverlay
  html5Settings: Html5Settings
  videoSettings: VideoSettings
  
  // Formats
  selectedFormats: Set<string>
  creativeSettings: Record<string, CreativeSettings>
  
  // UI State
  activeTab: 'input' | 'formats' | 'editor' | 'export'
  activePlatform: 'sklik' | 'google' | 'all'
  editingFormatId: string | null
  isGenerating: boolean
  generatingProgress: number
  
  // Competitor Analysis
  competitorUrl: string
  competitorAnalysis: any | null
  
  // Actions
  setApiKey: (key: string) => void
  setDarkMode: (dark: boolean) => void
  setSourceImage: (image: string | null) => void
  setSourcePrompt: (prompt: string) => void
  setBrandKit: (kit: Partial<BrandKit>) => void
  setDefaultText: (text: Partial<TextOverlay>) => void
  setHtml5Settings: (settings: Partial<Html5Settings>) => void
  setVideoSettings: (settings: Partial<VideoSettings>) => void
  toggleFormat: (formatId: string) => void
  selectAllFormats: (formatIds: string[]) => void
  deselectAllFormats: () => void
  setCreativeSettings: (formatId: string, settings: Partial<CreativeSettings>) => void
  setActiveTab: (tab: 'input' | 'formats' | 'editor' | 'export') => void
  setActivePlatform: (platform: 'sklik' | 'google' | 'all') => void
  setEditingFormatId: (id: string | null) => void
  setIsGenerating: (generating: boolean) => void
  setGeneratingProgress: (progress: number) => void
  setCompetitorUrl: (url: string) => void
  setCompetitorAnalysis: (analysis: any) => void
  resetProject: () => void
}

// ============================================================================
// STORE
// ============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Settings
      apiKey: '',
      darkMode: false,
      
      // Current project
      projectName: 'Nový projekt',
      sourceImage: null,
      sourcePrompt: '',
      brandKit: defaultBrandKit,
      defaultText: defaultTextOverlay,
      html5Settings: defaultHtml5Settings,
      videoSettings: defaultVideoSettings,
      
      // Formats
      selectedFormats: new Set<string>(),
      creativeSettings: {},
      
      // UI State
      activeTab: 'input',
      activePlatform: 'all',
      editingFormatId: null,
      isGenerating: false,
      generatingProgress: 0,
      
      // Competitor
      competitorUrl: '',
      competitorAnalysis: null,
      
      // Actions
      setApiKey: (key) => set({ apiKey: key }),
      setDarkMode: (dark) => set({ darkMode: dark }),
      setSourceImage: (image) => set({ sourceImage: image }),
      setSourcePrompt: (prompt) => set({ sourcePrompt: prompt }),
      
      setBrandKit: (kit) => set((state) => ({
        brandKit: { ...state.brandKit, ...kit }
      })),
      
      setDefaultText: (text) => set((state) => ({
        defaultText: { ...state.defaultText, ...text }
      })),
      
      setHtml5Settings: (settings) => set((state) => ({
        html5Settings: { ...state.html5Settings, ...settings }
      })),
      
      setVideoSettings: (settings) => set((state) => ({
        videoSettings: { ...state.videoSettings, ...settings }
      })),
      
      toggleFormat: (formatId) => set((state) => {
        const newSet = new Set(state.selectedFormats)
        if (newSet.has(formatId)) {
          newSet.delete(formatId)
        } else {
          newSet.add(formatId)
        }
        return { selectedFormats: newSet }
      }),
      
      selectAllFormats: (formatIds) => set((state) => {
        const newSet = new Set(state.selectedFormats)
        formatIds.forEach(id => newSet.add(id))
        return { selectedFormats: newSet }
      }),
      
      deselectAllFormats: () => set({ selectedFormats: new Set() }),
      
      setCreativeSettings: (formatId, settings) => set((state) => ({
        creativeSettings: {
          ...state.creativeSettings,
          [formatId]: {
            ...(state.creativeSettings[formatId] || {
              cropX: 0.5,
              cropY: 0.5,
              cropScale: 1,
              logoVisible: true,
              logoPosition: 'bottom-right',
              logoScale: 1,
            }),
            ...settings,
          },
        }
      })),
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActivePlatform: (platform) => set({ activePlatform: platform }),
      setEditingFormatId: (id) => set({ editingFormatId: id }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setGeneratingProgress: (progress) => set({ generatingProgress: progress }),
      setCompetitorUrl: (url) => set({ competitorUrl: url }),
      setCompetitorAnalysis: (analysis) => set({ competitorAnalysis: analysis }),
      
      resetProject: () => set({
        projectName: 'Nový projekt',
        sourceImage: null,
        sourcePrompt: '',
        brandKit: defaultBrandKit,
        defaultText: defaultTextOverlay,
        selectedFormats: new Set(),
        creativeSettings: {},
        competitorUrl: '',
        competitorAnalysis: null,
      }),
    }),
    {
      name: 'adcreative-studio-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        darkMode: state.darkMode,
        brandKit: state.brandKit,
        defaultText: state.defaultText,
        html5Settings: state.html5Settings,
        videoSettings: state.videoSettings,
      }),
    }
  )
)
