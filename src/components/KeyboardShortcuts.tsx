/**
 * Keyboard Shortcuts - Panel s klávesovými zkratkami
 */

import { useState, useEffect } from 'react'
import { Keyboard, X } from 'lucide-react'
import { Kbd } from '@/components/ui'

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Obecné',
    shortcuts: [
      { keys: ['?'], description: 'Zobrazit klávesové zkratky' },
      { keys: ['Esc'], description: 'Zavřít dialog / zrušit' },
      { keys: ['Ctrl', 'S'], description: 'Uložit změny' },
      { keys: ['Ctrl', 'Z'], description: 'Zpět' },
    ],
  },
  {
    title: 'Navigace',
    shortcuts: [
      { keys: ['D'], description: 'Dashboard' },
      { keys: ['G'], description: 'Generátor' },
      { keys: ['E'], description: 'Export' },
      { keys: ['S'], description: 'Nastavení' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { keys: ['Ctrl', 'A'], description: 'Vybrat všechny formáty' },
      { keys: ['Ctrl', 'D'], description: 'Zrušit výběr' },
      { keys: ['Enter'], description: 'Generovat kreativy' },
      { keys: ['Ctrl', 'E'], description: 'Exportovat' },
    ],
  },
  {
    title: 'Obrázky',
    shortcuts: [
      { keys: ['U'], description: 'Nahrát obrázek' },
      { keys: ['N'], description: 'Nový AI obrázek' },
      { keys: ['+'], description: 'Přiblížit' },
      { keys: ['-'], description: 'Oddálit' },
    ],
  },
]

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Klávesové zkratky</h2>
              <p className="text-sm text-white/50">Rychlejší práce s aplikací</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUTS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                    >
                      <span className="text-sm text-white/80">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <span key={j}>
                            <Kbd>{key}</Kbd>
                            {j < shortcut.keys.length - 1 && (
                              <span className="text-white/30 mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-white/40 text-center">
            Stiskněte <Kbd>?</Kbd> kdykoli pro zobrazení této nápovědy
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook pro keyboard shortcuts
export function useKeyboardShortcuts(onViewChange?: (view: string) => void) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoruj pokud je focus v inputu
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // ? = zobrazit shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }

      // Escape = zavřít
      if (e.key === 'Escape') {
        setShowShortcuts(false)
        return
      }

      // Navigační zkratky
      if (!e.ctrlKey && !e.metaKey && !e.altKey && onViewChange) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault()
            onViewChange('dashboard')
            break
          case 'g':
            e.preventDefault()
            onViewChange('editor')
            break
          case 'e':
            e.preventDefault()
            onViewChange('export')
            break
          case 's':
            e.preventDefault()
            onViewChange('settings')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onViewChange])

  return { showShortcuts, setShowShortcuts }
}

export default KeyboardShortcuts
