import { useState } from 'react'
import { COLORS } from '@/lib/design-tokens'

interface QuickActionFABProps {
  onMagicResize: () => void
  onTemplates: () => void
  onExport: () => void
  hasCreatives: boolean
}

export function QuickActionFAB({ onMagicResize, onTemplates, onExport, hasCreatives }: QuickActionFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const actions = [
    { icon: '✨', label: 'Magic Resize', onClick: onMagicResize, key: 'M' },
    { icon: '📋', label: 'Šablony', onClick: onTemplates, key: 'T' },
    { icon: '📦', label: 'Export', onClick: onExport, disabled: !hasCreatives, key: '⌘E' },
  ]
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 8,
    }}>
      {/* Action buttons (shown when open) */}
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setIsOpen(false) }}
              disabled={action.disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                backgroundColor: action.disabled ? COLORS.borderLight : 'white',
                border: 'none',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.5 : 1,
                animation: `fadeInUp 0.2s ease-out ${i * 0.05}s both`,
              }}
            >
              <span style={{ fontSize: 18 }}>{action.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>
                {action.label}
              </span>
              <kbd style={{
                fontSize: 10,
                padding: '2px 6px',
                backgroundColor: COLORS.pageBg,
                borderRadius: 4,
                color: COLORS.textMuted,
              }}>
                {action.key}
              </kbd>
            </button>
          ))}
        </div>
      )}
      
      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: isOpen 
            ? COLORS.textSecondary 
            : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          color: 'white',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, background 0.2s',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        +
      </button>
    </div>
  )
}
