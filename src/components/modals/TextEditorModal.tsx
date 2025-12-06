import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { COLORS } from '@/lib/design-tokens'

interface TextEditorModalProps {
  onClose: () => void
}

export function TextEditorModal({ onClose }: TextEditorModalProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(true)
  const { textOverlay, setTextOverlay } = useAppStore()
  
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div 
        ref={containerRef}
        style={{
          backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 24,
          width: 400, maxWidth: '90%',
        }} 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-editor-title"
      >
        <h3 id="text-editor-title" style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>
          Edit Text Overlay
        </h3>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
            Headline
          </label>
          <input
            type="text"
            value={textOverlay.headline}
            onChange={(e) => setTextOverlay({ headline: e.target.value })}
            placeholder="Enter headline..."
            style={{
              width: '100%', padding: '12px 16px', border: `1px solid ${COLORS.border}`,
              borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
            Description
          </label>
          <textarea
            value={textOverlay.subheadline}
            onChange={(e) => setTextOverlay({ subheadline: e.target.value })}
            placeholder="Enter description..."
            rows={3}
            style={{
              width: '100%', padding: '12px 16px', border: `1px solid ${COLORS.border}`,
              borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, backgroundColor: 'transparent',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={onClose} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8,
            backgroundColor: COLORS.primary, color: 'white',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
