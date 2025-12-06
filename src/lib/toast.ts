/**
 * Toast Notification System
 * 
 * Nahrazuje alert() za elegantní toast notifikace.
 * 
 * POUŽITÍ:
 * import { toast } from '@/lib/toast'
 * 
 * toast.success('Kreativa uložena!')
 * toast.error('Něco se pokazilo')
 * toast.loading('Generuji...', { id: 'gen' })
 * toast.dismiss('gen')
 */

import { create } from 'zustand'

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number // ms, 0 = persistent
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: number
}

interface ToastState {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id' | 'createdAt'> & { id?: string }) => string
  remove: (id: string) => void
  update: (id: string, toast: Partial<Toast>) => void
  clear: () => void
}

// ============================================================================
// STORE
// ============================================================================

let toastCounter = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  
  add: (toast) => {
    const id = toast.id || `toast-${++toastCounter}`
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? (toast.type === 'loading' ? 0 : 4000),
    }
    
    set((state) => {
      // Pokud toast s tímto ID existuje, aktualizuj ho
      const exists = state.toasts.find(t => t.id === id)
      if (exists) {
        return {
          toasts: state.toasts.map(t => t.id === id ? { ...t, ...newToast } : t)
        }
      }
      // Max 5 toastů najednou
      const toasts = [...state.toasts, newToast].slice(-5)
      return { toasts }
    })
    
    // Auto-dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().remove(id)
      }, newToast.duration)
    }
    
    return id
  },
  
  remove: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }))
  },
  
  update: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map(t => t.id === id ? { ...t, ...updates } : t)
    }))
  },
  
  clear: () => set({ toasts: [] }),
}))

// ============================================================================
// TOAST API
// ============================================================================

interface ToastOptions {
  id?: string
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

export const toast = {
  success: (message: string, options?: ToastOptions) => 
    useToastStore.getState().add({ type: 'success', message, ...options }),
    
  error: (message: string, options?: ToastOptions) => 
    useToastStore.getState().add({ type: 'error', message, duration: 6000, ...options }),
    
  warning: (message: string, options?: ToastOptions) => 
    useToastStore.getState().add({ type: 'warning', message, ...options }),
    
  info: (message: string, options?: ToastOptions) => 
    useToastStore.getState().add({ type: 'info', message, ...options }),
    
  loading: (message: string, options?: ToastOptions) => 
    useToastStore.getState().add({ type: 'loading', message, duration: 0, ...options }),
    
  dismiss: (id: string) => 
    useToastStore.getState().remove(id),
    
  clear: () => 
    useToastStore.getState().clear(),
    
  // Promise wrapper
  promise: async <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ): Promise<T> => {
    const id = toast.loading(messages.loading)
    try {
      const result = await promise
      useToastStore.getState().update(id, { 
        type: 'success', 
        message: messages.success,
        duration: 4000,
      })
      setTimeout(() => toast.dismiss(id), 4000)
      return result
    } catch (error: any) {
      useToastStore.getState().update(id, { 
        type: 'error', 
        message: messages.error,
        description: error.message,
        duration: 6000,
      })
      setTimeout(() => toast.dismiss(id), 6000)
      throw error
    }
  },
}

export default toast
