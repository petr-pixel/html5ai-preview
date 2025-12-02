/**
 * Undo/Redo History System
 * 
 * Centrální systém pro historii změn s podporou undo/redo.
 * 
 * POUŽITÍ:
 * import { useHistory, createHistoryMiddleware } from '@/lib/history'
 * 
 * // V komponentě
 * const { canUndo, canRedo, undo, redo, push } = useHistory()
 * 
 * // Při změně
 * push({ type: 'UPDATE_TEXT', before: oldText, after: newText })
 * 
 * // Undo/Redo
 * undo() // vrátí před změnou
 * redo() // znovu aplikuje změnu
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { debug } from './debug'

// ============================================================================
// TYPES
// ============================================================================

export interface HistoryEntry {
  id: string
  type: string
  timestamp: number
  description?: string
  before: any
  after: any
  // Volitelné - pro komplexní operace
  undo?: () => void
  redo?: () => void
}

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  maxSize: number
  
  // Actions
  push: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  clear: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // Batch operations
  startBatch: () => void
  endBatch: (description?: string) => void
  
  // Getters
  getLastEntry: () => HistoryEntry | null
  getHistory: () => HistoryEntry[]
}

// ============================================================================
// STORE
// ============================================================================

let entryId = 0
let batchEntries: Omit<HistoryEntry, 'id' | 'timestamp'>[] = []
let isBatching = false

export const useHistoryStore = create<HistoryState>()(
  subscribeWithSelector((set, get) => ({
    past: [],
    future: [],
    maxSize: 50,
    
    push: (entry) => {
      if (isBatching) {
        batchEntries.push(entry)
        return
      }
      
      const fullEntry: HistoryEntry = {
        ...entry,
        id: `history-${++entryId}`,
        timestamp: Date.now(),
      }
      
      set((state) => ({
        past: [...state.past.slice(-(state.maxSize - 1)), fullEntry],
        future: [], // Clear redo stack on new action
      }))
      
      debug.log('History', `Push: ${entry.type}`, { entry: fullEntry })
    },
    
    undo: () => {
      const { past, future } = get()
      if (past.length === 0) return null
      
      const entry = past[past.length - 1]
      
      // Execute custom undo if provided
      if (entry.undo) {
        entry.undo()
      }
      
      set({
        past: past.slice(0, -1),
        future: [entry, ...future],
      })
      
      debug.log('History', `Undo: ${entry.type}`)
      return entry
    },
    
    redo: () => {
      const { past, future, maxSize } = get()
      if (future.length === 0) return null
      
      const entry = future[0]
      
      // Execute custom redo if provided
      if (entry.redo) {
        entry.redo()
      }
      
      set({
        past: [...past.slice(-(maxSize - 1)), entry],
        future: future.slice(1),
      })
      
      debug.log('History', `Redo: ${entry.type}`)
      return entry
    },
    
    clear: () => {
      set({ past: [], future: [] })
      debug.log('History', 'Cleared')
    },
    
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
    
    startBatch: () => {
      isBatching = true
      batchEntries = []
    },
    
    endBatch: (description) => {
      if (!isBatching || batchEntries.length === 0) {
        isBatching = false
        return
      }
      
      // Combine batch into single entry
      const combinedEntry: HistoryEntry = {
        id: `history-batch-${++entryId}`,
        type: 'BATCH',
        timestamp: Date.now(),
        description: description || `${batchEntries.length} změn`,
        before: batchEntries.map(e => e.before),
        after: batchEntries.map(e => e.after),
      }
      
      set((state) => ({
        past: [...state.past.slice(-(state.maxSize - 1)), combinedEntry],
        future: [],
      }))
      
      isBatching = false
      batchEntries = []
      
      debug.log('History', `Batch: ${combinedEntry.description}`)
    },
    
    getLastEntry: () => {
      const { past } = get()
      return past.length > 0 ? past[past.length - 1] : null
    },
    
    getHistory: () => get().past,
  }))
)

// ============================================================================
// HOOK
// ============================================================================

export function useHistory() {
  const store = useHistoryStore()
  
  return {
    canUndo: store.canUndo(),
    canRedo: store.canRedo(),
    undo: store.undo,
    redo: store.redo,
    push: store.push,
    clear: store.clear,
    startBatch: store.startBatch,
    endBatch: store.endBatch,
    history: store.past,
    lastEntry: store.getLastEntry(),
  }
}

// ============================================================================
// ZUSTAND MIDDLEWARE
// ============================================================================

/**
 * Middleware pro automatické trackování změn v Zustand store
 */
export function createHistoryMiddleware<T extends object>(
  trackedKeys: (keyof T)[],
  getDescription?: (key: keyof T, before: any, after: any) => string
) {
  return (config: any) => (set: any, get: any, api: any) => {
    return config(
      (args: any) => {
        const before: any = {}
        const current = get()
        
        // Capture before state for tracked keys
        trackedKeys.forEach(key => {
          before[key] = current[key]
        })
        
        // Apply the update
        set(args)
        
        // Capture after state and push to history
        const after = get()
        trackedKeys.forEach(key => {
          if (before[key] !== after[key]) {
            useHistoryStore.getState().push({
              type: `UPDATE_${String(key).toUpperCase()}`,
              description: getDescription?.(key, before[key], after[key]),
              before: before[key],
              after: after[key],
            })
          }
        })
      },
      get,
      api
    )
  }
}

// ============================================================================
// HISTORY ACTION TYPES
// ============================================================================

export const HistoryActionTypes = {
  // Image
  SET_SOURCE_IMAGE: 'SET_SOURCE_IMAGE',
  CLEAR_SOURCE_IMAGE: 'CLEAR_SOURCE_IMAGE',
  
  // Text
  UPDATE_TEXT_LAYER: 'UPDATE_TEXT_LAYER',
  ADD_TEXT_ELEMENT: 'ADD_TEXT_ELEMENT',
  REMOVE_TEXT_ELEMENT: 'REMOVE_TEXT_ELEMENT',
  
  // Format
  SELECT_FORMAT: 'SELECT_FORMAT',
  DESELECT_FORMAT: 'DESELECT_FORMAT',
  UPDATE_FORMAT_OFFSET: 'UPDATE_FORMAT_OFFSET',
  
  // Creative
  ADD_CREATIVE: 'ADD_CREATIVE',
  REMOVE_CREATIVE: 'REMOVE_CREATIVE',
  UPDATE_CREATIVE: 'UPDATE_CREATIVE',
  
  // Batch
  BATCH: 'BATCH',
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vytvoří history entry pro text změnu
 */
export function createTextHistoryEntry(
  elementId: string,
  field: string,
  before: any,
  after: any
): Omit<HistoryEntry, 'id' | 'timestamp'> {
  return {
    type: HistoryActionTypes.UPDATE_TEXT_LAYER,
    description: `Změna ${field}`,
    before: { elementId, field, value: before },
    after: { elementId, field, value: after },
  }
}

/**
 * Vytvoří history entry pro pozici
 */
export function createPositionHistoryEntry(
  formatKey: string,
  before: { x: number; y: number },
  after: { x: number; y: number }
): Omit<HistoryEntry, 'id' | 'timestamp'> {
  return {
    type: HistoryActionTypes.UPDATE_FORMAT_OFFSET,
    description: `Posun obrázku`,
    before: { formatKey, offset: before },
    after: { formatKey, offset: after },
  }
}

// ============================================================================
// KEYBOARD INTEGRATION
// ============================================================================

/**
 * Keyboard handlers pro undo/redo
 */
export function getHistoryKeyboardHandlers() {
  const { undo, redo, canUndo, canRedo } = useHistoryStore.getState()
  
  return {
    onUndo: () => {
      if (canUndo()) {
        undo()
      }
    },
    onRedo: () => {
      if (canRedo()) {
        redo()
      }
    },
  }
}

export default {
  useHistory,
  useHistoryStore,
  createHistoryMiddleware,
  HistoryActionTypes,
  createTextHistoryEntry,
  createPositionHistoryEntry,
  getHistoryKeyboardHandlers,
}
