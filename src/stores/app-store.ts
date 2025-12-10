import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Format } from '@/lib/formats'

export interface Creative {
    id: string
    formatId: string
    format: Format
    imageUrl: string
    prompt: string
    createdAt: Date
}

export interface TextOverlay {
    enabled: boolean
    headline: string
    subheadline: string
    cta: string
    position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
    ctaColor: string
}

interface AppState {
    // API
    apiKey: string
    setApiKey: (key: string) => void

    // Platform
    platform: 'sklik' | 'google'
    setPlatform: (platform: 'sklik' | 'google') => void

    // Selected formats
    selectedFormats: Set<string>
    toggleFormat: (id: string) => void
    selectAllFormats: (ids: string[]) => void
    clearFormats: () => void

    // Source image
    sourceImage: string | null
    setSourceImage: (url: string | null) => void

    // Prompt
    prompt: string
    setPrompt: (prompt: string) => void

    // Creatives
    creatives: Creative[]
    addCreatives: (creatives: Creative[]) => void
    clearCreatives: () => void

    // Text overlay
    textOverlay: TextOverlay
    setTextOverlay: (overlay: Partial<TextOverlay>) => void

    // UI
    isGenerating: boolean
    setIsGenerating: (loading: boolean) => void
    progress: number
    setProgress: (progress: number) => void
    currentView: 'generator' | 'editor' | 'gallery' | 'video' | 'settings'
    setCurrentView: (view: 'generator' | 'editor' | 'gallery' | 'video' | 'settings') => void
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // API
            apiKey: '',
            setApiKey: (key) => set({ apiKey: key }),

            // Platform
            platform: 'sklik',
            setPlatform: (platform) => set({ platform }),

            // Selected formats
            selectedFormats: new Set<string>(),
            toggleFormat: (id) => set((state) => {
                const newSet = new Set(state.selectedFormats)
                if (newSet.has(id)) {
                    newSet.delete(id)
                } else {
                    newSet.add(id)
                }
                return { selectedFormats: newSet }
            }),
            selectAllFormats: (ids) => set({ selectedFormats: new Set(ids) }),
            clearFormats: () => set({ selectedFormats: new Set() }),

            // Source image
            sourceImage: null,
            setSourceImage: (url) => set({ sourceImage: url }),

            // Prompt
            prompt: '',
            setPrompt: (prompt) => set({ prompt }),

            // Creatives
            creatives: [],
            addCreatives: (creatives) => set((state) => ({
                creatives: [...state.creatives, ...creatives]
            })),
            clearCreatives: () => set({ creatives: [] }),

            // Text overlay
            textOverlay: {
                enabled: false,
                headline: '',
                subheadline: '',
                cta: 'Zjistit více',
                position: 'bottom-left',
                ctaColor: '#f97316',
            },
            setTextOverlay: (overlay) => set((state) => ({
                textOverlay: { ...state.textOverlay, ...overlay }
            })),

            // UI
            isGenerating: false,
            setIsGenerating: (loading) => set({ isGenerating: loading }),
            progress: 0,
            setProgress: (progress) => set({ progress }),
            currentView: 'generator',
            setCurrentView: (view) => set({ currentView: view }),
        }),
        {
            name: 'adcreative-store',
            partialize: (state) => ({
                apiKey: state.apiKey,
                platform: state.platform,
                textOverlay: state.textOverlay,
            }),
        }
    )
)
