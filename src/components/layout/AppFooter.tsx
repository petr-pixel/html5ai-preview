import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'
import { calculateCost, formatPrice } from '@/components/CostEstimate'

interface AppFooterProps {
  onOpenHistory: () => void
  onOpenTemplates: () => void
  onOpenValidation: () => void
}

export function AppFooter({ onOpenHistory, onOpenTemplates, onOpenValidation }: AppFooterProps) {
  const { creatives, selectedFormats } = useAppStore()
  const creativesArray = Object.values(creatives)

  return (
    <footer style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      backgroundColor: COLORS.cardBg,
      borderTop: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Creatives count with breakdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
            {creativesArray.length} kreativ{creativesArray.length === 1 ? 'a' : creativesArray.length > 4 ? '' : 'y'}
          </span>
          {creativesArray.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {(() => {
                const sklikCount = creativesArray.filter(c => c.platform === 'sklik').length
                const googleCount = creativesArray.filter(c => c.platform === 'google').length
                return (
                  <>
                    {sklikCount > 0 && (
                      <span style={{ 
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        backgroundColor: '#fee2e2', color: '#dc2626',
                      }}>
                        Sklik: {sklikCount}
                      </span>
                    )}
                    {googleCount > 0 && (
                      <span style={{ 
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        backgroundColor: '#dbeafe', color: '#2563eb',
                      }}>
                        Google: {googleCount}
                      </span>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
        
        {/* Separator */}
        {creativesArray.length > 0 && (
          <div style={{ width: 1, height: 20, backgroundColor: COLORS.border }} />
        )}
        
        {/* Cost Estimate Badge */}
        <div style={{
          padding: '4px 10px',
          backgroundColor: '#dcfce7',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>💰</span>
          <span>Est. {formatPrice(calculateCost('resize', { count: creativesArray.length || 1 }))}</span>
        </div>
        
        {/* Selected formats info */}
        {selectedFormats.size > 0 && (
          <div style={{ 
            fontSize: 12, color: COLORS.textMuted,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>📐</span>
            <span>{selectedFormats.size} formátů vybráno</span>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: 12 }}>
        {/* History Button */}
        <button
          onClick={onOpenHistory}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: COLORS.textSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🕐 Historie
        </button>
        
        {/* Templates Button */}
        <button
          onClick={onOpenTemplates}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: COLORS.textSecondary,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          📋 Šablony
        </button>
        
        {/* Export Button */}
        <button
          data-tour="export"
          onClick={onOpenValidation}
          disabled={creativesArray.length === 0}
          style={{
            padding: '10px 24px',
            backgroundColor: creativesArray.length > 0 ? COLORS.primary : COLORS.borderLight,
            color: creativesArray.length > 0 ? 'white' : COLORS.textMuted,
            border: 'none',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            cursor: creativesArray.length > 0 ? 'pointer' : 'not-allowed',
            opacity: creativesArray.length > 0 ? 1 : 0.7,
          }}
        >
          Export ({creativesArray.length})
        </button>
      </div>
    </footer>
  )
}
