import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'

type ViewType = 'editor' | 'gallery' | 'scoring' | 'copywriter' | 'branding' | 'video' | 'export' | 'admin'

interface ModalStates {
  contextMenu: unknown
  comparisonOpen: boolean
  tourStep: number | null
  shortcutsOpen: boolean
  historyOpen: boolean
  templateLibraryOpen: boolean
  magicResizeOpen: boolean
  validationOpen: boolean
  settingsOpen: boolean
  editingFormat: unknown
  showWelcome: boolean
}

interface ModalSetters {
  setContextMenu: (v: null) => void
  setComparisonOpen: (v: boolean) => void
  setTourStep: (v: number | null) => void
  setShortcutsOpen: (v: boolean) => void
  setHistoryOpen: (v: boolean) => void
  setTemplateLibraryOpen: (v: boolean) => void
  setMagicResizeOpen: (v: boolean) => void
  setValidationOpen: (v: boolean) => void
  setSettingsOpen: (v: boolean) => void
  setEditingFormat: (v: null) => void
  setShowWelcome: (v: boolean) => void
  setCurrentView: (v: ViewType) => void
  setShortcutToast: (v: { key: string; label: string } | null) => void
}

interface UndoRedo {
  canUndo: boolean
  canRedo: boolean
  handleUndo: () => void
  handleRedo: () => void
}

interface UseKeyboardShortcutsOptions {
  modalStates: ModalStates
  modalSetters: ModalSetters
  undoRedo: UndoRedo
  creativesCount: number
}

export function useKeyboardShortcuts({
  modalStates,
  modalSetters,
  undoRedo,
  creativesCount,
}: UseKeyboardShortcutsOptions) {
  const { platform, setPlatform } = useAppStore()
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const showToast = (key: string, label: string) => {
        modalSetters.setShortcutToast({ key, label })
        setTimeout(() => modalSetters.setShortcutToast(null), 1500)
      }
      
      // Escape = close all modals
      if (e.key === 'Escape') {
        if (modalStates.contextMenu) { modalSetters.setContextMenu(null); return }
        if (modalStates.comparisonOpen) { modalSetters.setComparisonOpen(false); return }
        if (modalStates.tourStep !== null) { modalSetters.setTourStep(null); return }
        if (modalStates.shortcutsOpen) { modalSetters.setShortcutsOpen(false); return }
        if (modalStates.historyOpen) { modalSetters.setHistoryOpen(false); return }
        if (modalStates.templateLibraryOpen) { modalSetters.setTemplateLibraryOpen(false); return }
        if (modalStates.magicResizeOpen) { modalSetters.setMagicResizeOpen(false); return }
        if (modalStates.validationOpen) { modalSetters.setValidationOpen(false); return }
        if (modalStates.settingsOpen) { modalSetters.setSettingsOpen(false); return }
        if (modalStates.editingFormat) { modalSetters.setEditingFormat(null); return }
        if (modalStates.showWelcome) { modalSetters.setShowWelcome(false); return }
      }
      
      // ? = shortcuts modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        modalSetters.setShortcutsOpen(true)
        showToast('?', 'Klávesové zkratky')
      }
      // M = Magic Resize
      if (e.key === 'm' || e.key === 'M') {
        modalSetters.setMagicResizeOpen(true)
        showToast('M', 'Magic Resize')
      }
      // T = Templates
      if (e.key === 't' || e.key === 'T') {
        modalSetters.setTemplateLibraryOpen(true)
        showToast('T', 'Šablony')
      }
      // H = History
      if (e.key === 'h' || e.key === 'H') {
        modalSetters.setHistoryOpen(true)
        showToast('H', 'Historie')
      }
      // Settings (Ctrl/Cmd + ,)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        modalSetters.setSettingsOpen(true)
        showToast('⌘,', 'Nastavení')
      }
      // Export (Ctrl/Cmd + E)
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        if (creativesCount > 0) {
          modalSetters.setValidationOpen(true)
          showToast('⌘E', 'Export')
        }
      }
      // G = Start tour
      if (e.key === 'g' || e.key === 'G') {
        modalSetters.setTourStep(0)
        showToast('G', 'Průvodce')
      }
      // P = Toggle platform
      if (e.key === 'p' || e.key === 'P') {
        const newPlatform = platform === 'sklik' ? 'google' : 'sklik'
        setPlatform(newPlatform)
        showToast('P', newPlatform === 'sklik' ? 'Sklik' : 'Google Ads')
      }
      // C = Comparison mode
      if (e.key === 'c' || e.key === 'C') {
        if (creativesCount >= 2) {
          modalSetters.setComparisonOpen(true)
          showToast('C', 'Porovnání')
        }
      }
      // Undo (Ctrl/Cmd + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undoRedo.handleUndo()
        if (undoRedo.canUndo) showToast('⌘Z', 'Zpět')
      }
      // Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        undoRedo.handleRedo()
        if (undoRedo.canRedo) showToast('⌘Y', 'Vpřed')
      }
      // 1-5 = navigation
      if (e.key === '1') { modalSetters.setCurrentView('editor'); showToast('1', 'Editor') }
      if (e.key === '2') { modalSetters.setCurrentView('gallery'); showToast('2', 'Galerie') }
      if (e.key === '3') { modalSetters.setCurrentView('scoring'); showToast('3', 'Scoring') }
      if (e.key === '4') { modalSetters.setCurrentView('copywriter'); showToast('4', 'Copywriter') }
      if (e.key === '5') { modalSetters.setCurrentView('branding'); showToast('5', 'Brand Kit') }
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    modalStates, modalSetters, undoRedo, creativesCount, platform, setPlatform
  ])
}
