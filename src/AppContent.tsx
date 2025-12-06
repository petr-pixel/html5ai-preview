/**
 * AdCreative Studio v7.15 - Refactored Modals
 * 
 * v7.15 ZMĚNY:
 * ✅ Extrahované modály do src/components/modals/
 * ✅ Design tokens v src/lib/design-tokens.ts
 * ✅ Menší AppContent.tsx (~3000 řádků)
 * 
 * v7.14: Focus trap, Tour spotlight, Global Undo/Redo
 * v7.13.1: Escape handler opraveny
 * v7.13: Context Menu, Auto-save, Color Palette Extractor
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { createCreativePackZip } from '@/lib/export'
import { SettingsModal } from '@/components/SettingsModal'
import { GalleryView } from '@/components/GalleryView'
import { CreativeScoring } from '@/components/CreativeScoring'
import { AICopywriter } from '@/components/AICopywriter'
import { AIBrandingKit } from '@/components/AIBrandingKit'
import { SlideshowBuilder } from '@/components/SlideshowBuilder'
import { BulkEditMode } from '@/components/BulkEditMode'
import { AdminDashboard } from '@/components/AdminDashboard'
import { FormatEditorV3 } from '@/components/FormatEditorV3'
import { QuickActionFAB } from '@/components/QuickActionFAB'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'
import { EditorView } from '@/components/layout/EditorView'
import { COLORS, SIZES } from '@/lib/design-tokens'
import { ViewWrapper } from '@/components/shared/UIComponents'
import { TourOverlay } from '@/components/TourOverlay'
import { DragOverlay } from '@/components/DragOverlay'
import { ShortcutToast } from '@/components/ShortcutToast'
import {
  ComparisonModal,
  ContextMenu,
  HistoryPanelModal,
  KeyboardShortcutsModal,
  MagicResizeModal,
  TemplateLibraryModal,
  TextEditorModal,
  ValidationModal,
  WelcomeModal
} from '@/components/modals'
import type { Format } from '@/types'

// COLORS and SIZES imported from @/lib/design-tokens

type ViewType = 'editor' | 'gallery' | 'scoring' | 'copywriter' | 'branding' | 'video' | 'export' | 'admin'

// ============================================================================
// MAIN APP
// ============================================================================

export function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('editor')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [textEditorOpen, setTextEditorOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<{ key: string; format: Format } | null>(null)
  const [validationOpen, setValidationOpen] = useState(false)
  const [magicResizeOpen, setMagicResizeOpen] = useState(false)
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('adcreative_welcomed')
  })
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [shortcutToast, setShortcutToast] = useState<{ key: string; label: string } | null>(null)
  const [tourStep, setTourStep] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; creativeId?: string } | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<typeof creatives[]>([])
  const [redoStack, setRedoStack] = useState<typeof creatives[]>([])
  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0
  
  const { profile } = useAuth()
  const { creatives, platform, setPlatform, sourceImage, addCreatives, setSourceImage, isGenerating, progress, setCreatives } = useAppStore()
  const creativesArray = Object.values(creatives)
  
  // Track creatives changes for undo
  const previousCreatives = useRef(creatives)
  useEffect(() => {
    if (JSON.stringify(creatives) !== JSON.stringify(previousCreatives.current)) {
      setUndoStack(prev => [...prev.slice(-19), previousCreatives.current])
      setRedoStack([])
      previousCreatives.current = creatives
    }
  }, [creatives])
  
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const previous = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, creatives])
    setUndoStack(prev => prev.slice(0, -1))
    setCreatives(previous)
    previousCreatives.current = previous
  }, [undoStack, creatives, setCreatives])
  
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, creatives])
    setRedoStack(prev => prev.slice(0, -1))
    setCreatives(next)
    previousCreatives.current = next
  }, [redoStack, creatives, setCreatives])
  
  // Auto-save effect
  useEffect(() => {
    if (creativesArray.length === 0 && !sourceImage) return
    
    const saveTimeout = setTimeout(() => {
      setIsSaving(true)
      try {
        // Save to localStorage
        localStorage.setItem('adcreative_autosave', JSON.stringify({
          creatives,
          sourceImage,
          platform,
          timestamp: new Date().toISOString(),
        }))
        setLastSaved(new Date())
      } catch (e) {
        console.error('Auto-save failed:', e)
      } finally {
        setTimeout(() => setIsSaving(false), 500)
      }
    }, 3000) // Save 3 seconds after last change
    
    return () => clearTimeout(saveTimeout)
  }, [creatives, sourceImage, platform, creativesArray.length])
  
  const handleConfirmExport = async () => {
    setValidationOpen(false)
    try {
      await createCreativePackZip(creativesArray, 'adcreative-export')
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export selhal')
    }
  }

  // navItems moved to AppHeader component
  const isAdmin = profile?.role === 'admin'

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      // Helper to show shortcut toast
      const showToast = (key: string, label: string) => {
        setShortcutToast({ key, label })
        setTimeout(() => setShortcutToast(null), 1500)
      }
      
      // Escape = close all modals
      if (e.key === 'Escape') {
        // Close modals in priority order (most recent/overlay first)
        if (contextMenu) { setContextMenu(null); return }
        if (comparisonOpen) { setComparisonOpen(false); return }
        if (tourStep !== null) { setTourStep(null); return }
        if (shortcutsOpen) { setShortcutsOpen(false); return }
        if (historyOpen) { setHistoryOpen(false); return }
        if (templateLibraryOpen) { setTemplateLibraryOpen(false); return }
        if (magicResizeOpen) { setMagicResizeOpen(false); return }
        if (validationOpen) { setValidationOpen(false); return }
        if (settingsOpen) { setSettingsOpen(false); return }
        if (editingFormat) { setEditingFormat(null); return }
        if (showWelcome) { setShowWelcome(false); return }
      }
      
      // ? = shortcuts modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShortcutsOpen(true)
        showToast('?', 'Klávesové zkratky')
      }
      // M = Magic Resize
      if (e.key === 'm' || e.key === 'M') {
        setMagicResizeOpen(true)
        showToast('M', 'Magic Resize')
      }
      // T = Templates
      if (e.key === 't' || e.key === 'T') {
        setTemplateLibraryOpen(true)
        showToast('T', 'Šablony')
      }
      // H = History
      if (e.key === 'h' || e.key === 'H') {
        setHistoryOpen(true)
        showToast('H', 'Historie')
      }
      // S = Settings (Ctrl/Cmd + ,)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
        showToast('⌘,', 'Nastavení')
      }
      // E = Export (Ctrl/Cmd + E)
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        if (creativesArray.length > 0) {
          setValidationOpen(true)
          showToast('⌘E', 'Export')
        }
      }
      // G = Start tour
      if (e.key === 'g' || e.key === 'G') {
        setTourStep(0)
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
        if (creativesArray.length >= 2) {
          setComparisonOpen(true)
          showToast('C', 'Porovnání')
        }
      }
      // Undo (Ctrl/Cmd + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        if (canUndo) showToast('⌘Z', 'Zpět')
      }
      // Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
        if (canRedo) showToast('⌘Y', 'Vpřed')
      }
      // 1-5 = navigation
      if (e.key === '1') { setCurrentView('editor'); showToast('1', 'Editor') }
      if (e.key === '2') { setCurrentView('gallery'); showToast('2', 'Galerie') }
      if (e.key === '3') { setCurrentView('scoring'); showToast('3', 'Scoring') }
      if (e.key === '4') { setCurrentView('copywriter'); showToast('4', 'Copywriter') }
      if (e.key === '5') { setCurrentView('branding'); showToast('5', 'Brand Kit') }
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tourStep, shortcutsOpen, historyOpen, templateLibraryOpen, magicResizeOpen, validationOpen, settingsOpen, creativesArray.length, platform, setPlatform, comparisonOpen, contextMenu, editingFormat, showWelcome, handleUndo, handleRedo, canUndo, canRedo])

  // Global drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if leaving the window
    if (e.relatedTarget === null || !(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(f => f.type.startsWith('image/'))
    
    if (imageFile) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        if (dataUrl) {
          setSourceImage(dataUrl)
          setCurrentView('editor')
        }
      }
      reader.readAsDataURL(imageFile)
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        gridTemplateRows: `${SIZES.headerHeight}px 1fr ${SIZES.footerHeight}px`,
        backgroundColor: COLORS.pageBg,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: COLORS.textPrimary,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        // Only show context menu if not clicking on specific elements
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('input') || target.closest('select')) {
          return
        }
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      
      {/* GLOBAL DROP OVERLAY */}
      <DragOverlay visible={isDragOver} />
      
      {/* HEADER */}
      <AppHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        isGenerating={isGenerating}
        progress={progress}
        isSaving={isSaving}
        lastSaved={lastSaved}
        canUndo={canUndo}
        canRedo={canRedo}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onStartTour={() => setTourStep(0)}
      />

      {/* MAIN */}
      <main style={{ overflow: 'hidden' }}>
        {currentView === 'editor' && (
          <EditorView 
            onOpenTextEditor={() => setTextEditorOpen(true)} 
            onEditFormat={setEditingFormat}
            onMagicResize={() => setMagicResizeOpen(true)}
            onOpenTemplates={() => setTemplateLibraryOpen(true)}
            onChangeView={(view) => setCurrentView(view as ViewType)}
          />
        )}
        {currentView === 'gallery' && <ViewWrapper><GalleryView /></ViewWrapper>}
        {currentView === 'scoring' && <ViewWrapper><CreativeScoring /></ViewWrapper>}
        {currentView === 'copywriter' && <ViewWrapper><AICopywriter /></ViewWrapper>}
        {currentView === 'branding' && <ViewWrapper><AIBrandingKit /></ViewWrapper>}
        {currentView === 'video' && <ViewWrapper><SlideshowBuilder /></ViewWrapper>}
        {currentView === 'export' && <ViewWrapper><BulkEditMode /></ViewWrapper>}
        {currentView === 'admin' && isAdmin && <ViewWrapper><AdminDashboard /></ViewWrapper>}
      </main>

      {/* FOOTER */}
      <AppFooter
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenTemplates={() => setTemplateLibraryOpen(true)}
        onOpenValidation={() => setValidationOpen(true)}
      />

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {textEditorOpen && (
        <TextEditorModal onClose={() => setTextEditorOpen(false)} />
      )}
      
      {/* FORMAT EDITOR V3 MODAL */}
      {editingFormat && (
        <FormatEditorV3
          formatKey={editingFormat.key}
          format={editingFormat.format}
          sourceImage={sourceImage}
          onClose={() => setEditingFormat(null)}
          onSave={(creative) => {
            if (creative) {
              addCreatives([creative])
            }
            setEditingFormat(null)
          }}
        />
      )}
      
      {/* VALIDATION MODAL BEFORE EXPORT */}
      {validationOpen && (
        <ValidationModal 
          creatives={creativesArray}
          onClose={() => setValidationOpen(false)}
          onConfirm={handleConfirmExport}
        />
      )}
      
      {/* MAGIC RESIZE MODAL */}
      {magicResizeOpen && (
        <MagicResizeModal onClose={() => setMagicResizeOpen(false)} />
      )}
      
      {/* TEMPLATE LIBRARY MODAL */}
      {templateLibraryOpen && (
        <TemplateLibraryModal onClose={() => setTemplateLibraryOpen(false)} />
      )}
      
      {/* WELCOME MODAL */}
      {showWelcome && (
        <WelcomeModal 
          onClose={() => {
            setShowWelcome(false)
            localStorage.setItem('adcreative_welcomed', 'true')
          }} 
          onOpenSettings={() => setSettingsOpen(true)} 
          onStartTour={() => {
            setShowWelcome(false)
            localStorage.setItem('adcreative_welcomed', 'true')
            setTourStep(0)
          }}
        />
      )}
      
      {/* INTERACTIVE TOUR with Spotlight */}
      {tourStep !== null && (
        <TourOverlay 
          step={tourStep} 
          onNext={() => setTourStep(s => s !== null && s < 4 ? s + 1 : null)}
          onSkip={() => setTourStep(null)}
          onPrev={() => setTourStep(s => s !== null && s > 0 ? s - 1 : 0)}
        />
      )}
      
      {/* HISTORY PANEL */}
      {historyOpen && (
        <HistoryPanelModal onClose={() => setHistoryOpen(false)} />
      )}
      
      {/* COMPARISON MODAL */}
      {comparisonOpen && creativesArray.length >= 2 && (
        <ComparisonModal 
          creatives={creativesArray}
          onClose={() => setComparisonOpen(false)} 
        />
      )}
      
      {/* CONTEXT MENU */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          creativeId={contextMenu.creativeId}
          onClose={() => setContextMenu(null)}
          onOpenComparison={() => {
            setContextMenu(null)
            if (creativesArray.length >= 2) setComparisonOpen(true)
          }}
          onOpenHistory={() => {
            setContextMenu(null)
            setHistoryOpen(true)
          }}
          onOpenTemplates={() => {
            setContextMenu(null)
            setTemplateLibraryOpen(true)
          }}
          onMagicResize={() => {
            setContextMenu(null)
            setMagicResizeOpen(true)
          }}
        />
      )}
      
      {/* KEYBOARD SHORTCUTS MODAL */}
      {shortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
      
      {/* SHORTCUT TOAST FEEDBACK */}
      <ShortcutToast shortcut={shortcutToast} />
      
      {/* FLOATING ACTION BUTTON */}
      <QuickActionFAB 
        onMagicResize={() => setMagicResizeOpen(true)}
        onTemplates={() => setTemplateLibraryOpen(true)}
        onExport={() => creativesArray.length > 0 && setValidationOpen(true)}
        hasCreatives={creativesArray.length > 0}
      />
    </div>
  )
}

export default AppContent
