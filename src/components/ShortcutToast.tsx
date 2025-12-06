interface ShortcutToastProps {
  shortcut: { key: string; label: string } | null
}

export function ShortcutToast({ shortcut }: ShortcutToastProps) {
  if (!shortcut) return null
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0,0,0,0.85)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'fadeInUp 0.2s ease-out',
    }}>
      <kbd style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'monospace',
        minWidth: 28,
        textAlign: 'center',
      }}>
        {shortcut.key}
      </kbd>
      <span style={{ fontSize: 14, fontWeight: 500 }}>
        {shortcut.label}
      </span>
    </div>
  )
}
