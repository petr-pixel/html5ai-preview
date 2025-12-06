import { useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'

interface HistoryPanelModalProps {
  onClose: () => void
}

export function HistoryPanelModal({ onClose }: HistoryPanelModalProps) {
  const { creatives, clearCreatives, deleteCreative } = useAppStore()
  const creativesArray = Object.values(creatives)
  
  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof creativesArray> = {}
    creativesArray.forEach(c => {
      const date = new Date(c.createdAt).toLocaleDateString('cs-CZ')
      if (!groups[date]) groups[date] = []
      groups[date].push(c)
    })
    return groups
  }, [creativesArray])
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: COLORS.cardBg, borderRadius: 16,
        width: 600, maxWidth: '90%', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>🕐 Historie kreativ</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.textSecondary }}>
              {creativesArray.length} kreativ celkem
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {creativesArray.length > 0 && (
              <button onClick={() => { clearCreatives(); onClose() }} style={{
                padding: '8px 14px', border: `1px solid #ef4444`,
                borderRadius: 8, backgroundColor: 'transparent',
                color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                Smazat vše
              </button>
            )}
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
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {creativesArray.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div style={{ fontSize: 14 }}>Zatím žádné kreativy</div>
            </div>
          ) : (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontSize: 12, fontWeight: 600, color: COLORS.textMuted,
                  marginBottom: 12, textTransform: 'uppercase',
                }}>
                  {date}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {items.map(c => (
                    <div key={c.id} style={{
                      borderRadius: 8, overflow: 'hidden',
                      border: `1px solid ${COLORS.border}`,
                      position: 'relative',
                    }}>
                      <div style={{ aspectRatio: '4/3', position: 'relative' }}>
                        <img src={c.imageUrl} alt="" style={{ 
                          width: '100%', height: '100%', objectFit: 'cover',
                        }} />
                        <div style={{
                          position: 'absolute', bottom: 4, right: 4,
                          padding: '2px 6px', borderRadius: 4,
                          backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                          fontSize: 10,
                        }}>
                          {c.format.width}×{c.format.height}
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCreative(c.id) }}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 24, height: 24,
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0.8,
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                          title="Smazat kreativu"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
