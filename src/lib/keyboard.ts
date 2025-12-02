/**
 * Keyboard Shortcuts System
 * 
 * Centrální systém pro klávesové zkratky.
 * 
 * POUŽITÍ:
 * import { useKeyboardShortcuts, SHORTCUTS } from '@/lib/keyboard'
 * 
 * useKeyboardShortcuts({
 *   onSave: () => handleSave(),
 *   onUndo: () => handleUndo(),
 * })
 * 
 * ZKRATKY:
 * Ctrl+S - Uložit
 * Ctrl+Z - Zpět
 * Ctrl+Shift+Z - Vpřed
 * Ctrl+E - Export
 * Ctrl+G - Generovat
 * Escape - Zavřít modal/editor
 * Delete - Smazat vybrané
 * Ctrl+A - Vybrat vše
 * Ctrl+D - Zrušit výběr
 * ? - Zobrazit nápovědu
 */

import { useEffect, useCallback, useState } from 'react'
import { debug } from './debug'

// ============================================================================
// TYPES
// ============================================================================

export interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean  // Cmd na Mac
  description: string
  category: 'general' | 'editor' | 'gallery' | 'navigation'
}

export interface ShortcutHandlers {
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onExport?: () => void
  onGenerate?: () => void
  onEscape?: () => void
  onDelete?: () => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  onHelp?: () => void
  onTogglePreview?: () => void
  onNextFormat?: () => void
  onPrevFormat?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetZoom?: () => void
}

// ============================================================================
// SHORTCUT DEFINITIONS
// ============================================================================

export const SHORTCUTS: Record<string, Shortcut> = {
  // General
  save: {
    key: 's',
    ctrl: true,
    description: 'Uložit změny',
    category: 'general',
  },
  undo: {
    key: 'z',
    ctrl: true,
    description: 'Zpět',
    category: 'general',
  },
  redo: {
    key: 'z',
    ctrl: true,
    shift: true,
    description: 'Vpřed',
    category: 'general',
  },
  export: {
    key: 'e',
    ctrl: true,
    description: 'Exportovat kreativy',
    category: 'general',
  },
  generate: {
    key: 'g',
    ctrl: true,
    description: 'Generovat obrázek',
    category: 'general',
  },
  escape: {
    key: 'Escape',
    description: 'Zavřít dialog / Zrušit',
    category: 'general',
  },
  help: {
    key: '?',
    shift: true,
    description: 'Zobrazit nápovědu',
    category: 'general',
  },
  
  // Gallery
  delete: {
    key: 'Delete',
    description: 'Smazat vybrané',
    category: 'gallery',
  },
  selectAll: {
    key: 'a',
    ctrl: true,
    description: 'Vybrat vše',
    category: 'gallery',
  },
  deselectAll: {
    key: 'd',
    ctrl: true,
    description: 'Zrušit výběr',
    category: 'gallery',
  },
  
  // Editor
  togglePreview: {
    key: 'p',
    ctrl: true,
    description: 'Přepnout náhled',
    category: 'editor',
  },
  nextFormat: {
    key: 'ArrowRight',
    ctrl: true,
    description: 'Další formát',
    category: 'editor',
  },
  prevFormat: {
    key: 'ArrowLeft',
    ctrl: true,
    description: 'Předchozí formát',
    category: 'editor',
  },
  zoomIn: {
    key: '+',
    ctrl: true,
    description: 'Přiblížit',
    category: 'editor',
  },
  zoomOut: {
    key: '-',
    ctrl: true,
    description: 'Oddálit',
    category: 'editor',
  },
  resetZoom: {
    key: '0',
    ctrl: true,
    description: 'Resetovat zoom',
    category: 'editor',
  },
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorovat pokud je focus v inputu
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Povolit jen Escape
        if (e.key !== 'Escape') return
      }
      
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const key = e.key.toLowerCase()
      
      let handled = false
      
      // Save: Ctrl+S
      if (ctrl && !shift && key === 's') {
        e.preventDefault()
        handlers.onSave?.()
        handled = true
      }
      
      // Undo: Ctrl+Z
      if (ctrl && !shift && key === 'z') {
        e.preventDefault()
        handlers.onUndo?.()
        handled = true
      }
      
      // Redo: Ctrl+Shift+Z
      if (ctrl && shift && key === 'z') {
        e.preventDefault()
        handlers.onRedo?.()
        handled = true
      }
      
      // Export: Ctrl+E
      if (ctrl && !shift && key === 'e') {
        e.preventDefault()
        handlers.onExport?.()
        handled = true
      }
      
      // Generate: Ctrl+G
      if (ctrl && !shift && key === 'g') {
        e.preventDefault()
        handlers.onGenerate?.()
        handled = true
      }
      
      // Escape
      if (e.key === 'Escape') {
        handlers.onEscape?.()
        handled = true
      }
      
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Jen pokud není v inputu
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          handlers.onDelete?.()
          handled = true
        }
      }
      
      // Select All: Ctrl+A
      if (ctrl && !shift && key === 'a') {
        e.preventDefault()
        handlers.onSelectAll?.()
        handled = true
      }
      
      // Deselect: Ctrl+D
      if (ctrl && !shift && key === 'd') {
        e.preventDefault()
        handlers.onDeselectAll?.()
        handled = true
      }
      
      // Help: ?
      if (shift && key === '?') {
        handlers.onHelp?.()
        handled = true
      }
      
      // Toggle Preview: Ctrl+P
      if (ctrl && !shift && key === 'p') {
        e.preventDefault()
        handlers.onTogglePreview?.()
        handled = true
      }
      
      // Navigation
      if (ctrl && e.key === 'ArrowRight') {
        e.preventDefault()
        handlers.onNextFormat?.()
        handled = true
      }
      
      if (ctrl && e.key === 'ArrowLeft') {
        e.preventDefault()
        handlers.onPrevFormat?.()
        handled = true
      }
      
      // Zoom
      if (ctrl && (key === '+' || key === '=')) {
        e.preventDefault()
        handlers.onZoomIn?.()
        handled = true
      }
      
      if (ctrl && key === '-') {
        e.preventDefault()
        handlers.onZoomOut?.()
        handled = true
      }
      
      if (ctrl && key === '0') {
        e.preventDefault()
        handlers.onResetZoom?.()
        handled = true
      }
      
      if (handled) {
        debug.log('Keyboard', `Shortcut: ${ctrl ? 'Ctrl+' : ''}${shift ? 'Shift+' : ''}${e.key}`)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, enabled])
}

// ============================================================================
// HELP MODAL HOOK
// ============================================================================

export function useShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false)
  
  useKeyboardShortcuts({
    onHelp: () => setIsOpen(true),
    onEscape: () => setIsOpen(false),
  })
  
  const shortcutsByCategory = {
    general: Object.entries(SHORTCUTS).filter(([_, s]) => s.category === 'general'),
    editor: Object.entries(SHORTCUTS).filter(([_, s]) => s.category === 'editor'),
    gallery: Object.entries(SHORTCUTS).filter(([_, s]) => s.category === 'gallery'),
    navigation: Object.entries(SHORTCUTS).filter(([_, s]) => s.category === 'navigation'),
  }
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    shortcutsByCategory,
  }
}

// ============================================================================
// FORMAT SHORTCUT STRING
// ============================================================================

export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = []
  
  if (shortcut.ctrl) {
    // Použít Cmd na Mac, Ctrl jinde
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')
  
  // Format key
  let key = shortcut.key
  if (key === ' ') key = 'Space'
  if (key === 'ArrowLeft') key = '←'
  if (key === 'ArrowRight') key = '→'
  if (key === 'ArrowUp') key = '↑'
  if (key === 'ArrowDown') key = '↓'
  if (key === 'Escape') key = 'Esc'
  if (key === 'Delete') key = 'Del'
  
  parts.push(key.toUpperCase())
  
  return parts.join('+')
}

// ============================================================================
// SHORTCUT BADGE COMPONENT DATA
// ============================================================================

export function getShortcutBadge(shortcutKey: keyof typeof SHORTCUTS): string | null {
  const shortcut = SHORTCUTS[shortcutKey]
  if (!shortcut) return null
  return formatShortcut(shortcut)
}

export default {
  SHORTCUTS,
  useKeyboardShortcuts,
  useShortcutHelp,
  formatShortcut,
  getShortcutBadge,
}
