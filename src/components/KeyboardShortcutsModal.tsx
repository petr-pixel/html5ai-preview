/**
 * Keyboard Shortcuts Help Modal
 * 
 * Zobrazuje přehled všech klávesových zkratek.
 * Otevře se pomocí Shift+?
 */

import { SHORTCUTS, formatShortcut, type Shortcut } from '@/lib/keyboard'
import { X, Keyboard } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null
  
  const categories = [
    { id: 'general', name: 'Obecné', icon: '⌨️' },
    { id: 'editor', name: 'Editor', icon: '✏️' },
    { id: 'gallery', name: 'Galerie', icon: '🖼️' },
  ]
  
  const shortcutsByCategory = categories.map(cat => ({
    ...cat,
    shortcuts: Object.entries(SHORTCUTS)
      .filter(([_, s]) => s.category === cat.id)
      .map(([key, shortcut]) => ({ key, ...shortcut }))
  }))
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Klávesové zkratky
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-8 md:grid-cols-2">
            {shortcutsByCategory.map(category => (
              <div key={category.id}>
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  <span>{category.icon}</span>
                  {category.name}
                </h3>
                
                <div className="space-y-2">
                  {category.shortcuts.map(shortcut => (
                    <div 
                      key={shortcut.key}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Stiskněte <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Shift+?</kbd> pro zobrazení této nápovědy
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SHORTCUT BADGE (pro zobrazení u tlačítek)
// ============================================================================

interface ShortcutBadgeProps {
  shortcut: keyof typeof SHORTCUTS | Shortcut
  className?: string
}

export function ShortcutBadge({ shortcut, className = '' }: ShortcutBadgeProps) {
  const s = typeof shortcut === 'string' ? SHORTCUTS[shortcut] : shortcut
  if (!s) return null
  
  return (
    <kbd className={`
      hidden sm:inline-block ml-2 px-1.5 py-0.5 text-xs font-mono 
      bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 
      rounded border border-gray-200 dark:border-gray-600
      ${className}
    `}>
      {formatShortcut(s)}
    </kbd>
  )
}

export default KeyboardShortcutsModal
