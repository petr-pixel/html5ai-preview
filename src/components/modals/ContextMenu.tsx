import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'

interface ContextMenuProps {
  x: number
  y: number
  creativeId?: string
  onClose: () => void
  onOpenComparison: () => void
  onOpenHistory: () => void
  onOpenTemplates: () => void
  onMagicResize: () => void
}

export function ContextMenu({ 
  x, y, creativeId, onClose, 
  onOpenComparison, onOpenHistory, onOpenTemplates, onMagicResize 
}: ContextMenuProps) {
  const { deleteCreative, creatives } = useAppStore()
  const creative = creativeId ? creatives[creativeId] : null
  
  // Close on click outside
  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener('click', handler)
    window.addEventListener('contextmenu', handler)
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('contextmenu', handler)
    }
  }, [onClose])
  
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  
  // Adjust position to stay within viewport
  const menuWidth = 200
  const menuHeight = creative ? 280 : 200
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10)
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10)
  
  const menuItems = [
    ...(creative ? [
      { icon: '📥', label: 'Stáhnout', action: () => {
        const link = document.createElement('a')
        link.href = creative.imageUrl
        link.download = `${creative.format.width}x${creative.format.height}.png`
        link.click()
        onClose()
      }},
      { icon: '🗑️', label: 'Smazat', action: () => {
        deleteCreative(creativeId!)
        onClose()
      }, danger: true },
      { divider: true },
    ] : []),
    { icon: '🔍', label: 'Porovnat kreativy', action: onOpenComparison, shortcut: 'C' },
    { icon: '✨', label: 'Magic Resize', action: onMagicResize, shortcut: 'M' },
    { icon: '📋', label: 'Šablony', action: onOpenTemplates, shortcut: 'T' },
    { icon: '🕐', label: 'Historie', action: onOpenHistory, shortcut: 'H' },
  ]
  
  return (
    <div 
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        backgroundColor: 'white',
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        zIndex: 2000,
        minWidth: menuWidth,
        overflow: 'hidden',
        animation: 'fadeInUp 0.15s ease-out',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {creative && (
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${COLORS.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <img 
            src={creative.imageUrl} 
            alt="" 
            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {creative.format.width}×{creative.format.height}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
              {creative.format.name}
            </div>
          </div>
        </div>
      )}
      
      <div style={{ padding: 6 }}>
        {menuItems.map((item, i) => 
          'divider' in item ? (
            <div key={i} style={{ height: 1, backgroundColor: COLORS.borderLight, margin: '6px 0' }} />
          ) : (
            <button
              key={i}
              onClick={item.action}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: 'transparent',
                color: 'danger' in item && item.danger ? '#ef4444' : COLORS.textPrimary,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.pageBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {'shortcut' in item && item.shortcut && (
                <kbd style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  backgroundColor: COLORS.pageBg,
                  borderRadius: 4,
                  color: COLORS.textMuted,
                }}>
                  {item.shortcut}
                </kbd>
              )}
            </button>
          )
        )}
      </div>
    </div>
  )
}
