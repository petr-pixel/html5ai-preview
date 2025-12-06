import { useEffect } from 'react'
import { COLORS } from '@/lib/design-tokens'

const SHORTCUTS = [
  { category: 'Obecné', shortcuts: [
    { keys: ['?'], desc: 'Zobrazit klávesové zkratky' },
    { keys: ['Esc'], desc: 'Zavřít modal' },
    { keys: ['⌘', ','], desc: 'Nastavení' },
    { keys: ['G'], desc: 'Spustit průvodce' },
    { keys: ['P'], desc: 'Přepnout platformu (Sklik ↔ Google)' },
    { keys: ['C'], desc: 'Porovnání kreativ' },
  ]},
  { category: 'Navigace', shortcuts: [
    { keys: ['1'], desc: 'Editor' },
    { keys: ['2'], desc: 'Galerie' },
    { keys: ['3'], desc: 'Scoring' },
    { keys: ['4'], desc: 'Copywriter' },
    { keys: ['5'], desc: 'Brand Kit' },
  ]},
  { category: 'Rychlé akce', shortcuts: [
    { keys: ['M'], desc: 'Magic Resize' },
    { keys: ['T'], desc: 'Templates' },
    { keys: ['H'], desc: 'Historie' },
    { keys: ['⌘', 'E'], desc: 'Export' },
  ]},
  { category: 'Editor (ve FormatEditorV3)', shortcuts: [
    { keys: ['⌘', 'Z'], desc: 'Zpět' },
    { keys: ['⌘', 'Y'], desc: 'Vpřed' },
    { keys: ['↑', '↓', '←', '→'], desc: 'Posun elementu' },
    { keys: ['Shift', '+', 'šipka'], desc: 'Rychlý posun (10px)' },
  ]},
]

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: COLORS.cardBg, borderRadius: 16,
        width: 600, maxWidth: '90%', maxHeight: '85vh',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>⌨️ Klávesové zkratky</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.textSecondary }}>
              Pracujte rychleji s klávesnicí
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, border: 'none', borderRadius: 8,
            backgroundColor: COLORS.pageBg, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div style={{ padding: 24, overflow: 'auto', maxHeight: 'calc(85vh - 80px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {SHORTCUTS.map(section => (
              <div key={section.category}>
                <div style={{ 
                  fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
                  textTransform: 'uppercase', marginBottom: 12,
                }}>
                  {section.category}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {section.shortcuts.map((shortcut, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', backgroundColor: COLORS.pageBg, borderRadius: 8,
                    }}>
                      <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                        {shortcut.desc}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {shortcut.keys.map((key, j) => (
                          <span key={j}>
                            <kbd style={{
                              padding: '4px 8px',
                              backgroundColor: COLORS.cardBg,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: 4,
                              fontSize: 11,
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}>
                              {key}
                            </kbd>
                            {j < shortcut.keys.length - 1 && (
                              <span style={{ margin: '0 2px', color: COLORS.textMuted }}>+</span>
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
      </div>
    </div>
  )
}
