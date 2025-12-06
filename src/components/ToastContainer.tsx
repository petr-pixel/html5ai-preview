/**
 * Toast UI Component
 * 
 * Renderuje toast notifikace v pravém horním rohu.
 * Přidej do App.tsx: <ToastContainer />
 */

import { useToastStore, type Toast } from '@/lib/toast'
import { X, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

// ============================================================================
// SINGLE TOAST
// ============================================================================

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false)
  
  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(onDismiss, 200)
  }
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
  }
  
  const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    loading: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  }
  
  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        transform transition-all duration-200 ease-out
        ${bgColors[toast.type]}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {toast.message}
        </p>
        {toast.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick()
              handleDismiss()
            }}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      
      {toast.type !== 'loading' && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  )
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const remove = useToastStore((state) => state.remove)
  
  if (toasts.length === 0) return null
  
  return (
    <div 
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem 
            toast={toast} 
            onDismiss={() => remove(toast.id)} 
          />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
