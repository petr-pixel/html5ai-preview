interface DragOverlayProps {
  visible: boolean
}

export function DragOverlay({ visible }: DragOverlayProps) {
  if (!visible) return null
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(37, 99, 235, 0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 1.5s infinite',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <div style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>
        Pusťte obrázek zde
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
        PNG, JPG, WebP do 10MB
      </div>
    </div>
  )
}
