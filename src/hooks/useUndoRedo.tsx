import { useState, useCallback, useEffect } from 'react'

interface UndoRedoState<T> {
  past: T[]
  present: T
  future: T[]
}

interface UndoRedoActions<T> {
  set: (newPresent: T, actionName?: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  reset: (newPresent: T) => void
  history: { past: number; future: number }
}

/**
 * Global Undo/Redo Hook
 * Manages state history with undo/redo capabilities
 * 
 * @param initialState - Initial state value
 * @param maxHistory - Maximum number of history items to keep (default: 50)
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistory: number = 50
): [T, UndoRedoActions<T>] {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const set = useCallback((newPresent: T, _actionName?: string) => {
    setState(currentState => {
      if (newPresent === currentState.present) {
        return currentState
      }

      const newPast = [...currentState.past, currentState.present].slice(-maxHistory)

      return {
        past: newPast,
        present: newPresent,
        future: [], // Clear future when new action is performed
      }
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    setState(currentState => {
      if (currentState.past.length === 0) {
        return currentState
      }

      const previous = currentState.past[currentState.past.length - 1]
      const newPast = currentState.past.slice(0, -1)

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState(currentState => {
      if (currentState.future.length === 0) {
        return currentState
      }

      const next = currentState.future[0]
      const newFuture = currentState.future.slice(1)

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    })
  }, [])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return [
    state.present,
    {
      set,
      undo,
      redo,
      canUndo,
      canRedo,
      reset,
      history: {
        past: state.past.length,
        future: state.future.length,
      },
    },
  ]
}

/**
 * Undo/Redo indicator component
 */
export function UndoRedoIndicator({ 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo,
  historyCount,
}: { 
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  historyCount?: { past: number; future: number }
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Zpět (⌘Z)"
        style={{
          width: 32,
          height: 32,
          border: 'none',
          borderRadius: 6,
          backgroundColor: canUndo ? '#f3f4f6' : '#f9fafb',
          color: canUndo ? '#374151' : '#d1d5db',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6"/>
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
        </svg>
      </button>
      
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Vpřed (⌘Y)"
        style={{
          width: 32,
          height: 32,
          border: 'none',
          borderRadius: 6,
          backgroundColor: canRedo ? '#f3f4f6' : '#f9fafb',
          color: canRedo ? '#374151' : '#d1d5db',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6"/>
          <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
        </svg>
      </button>
      
      {historyCount && (
        <span style={{ 
          fontSize: 10, 
          color: '#9ca3af',
          marginLeft: 4,
        }}>
          {historyCount.past}/{historyCount.future}
        </span>
      )}
    </div>
  )
}
