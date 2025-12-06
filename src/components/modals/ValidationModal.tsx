import { useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'
import type { Creative } from '@/types'

interface ValidationModalProps {
  creatives: Creative[]
  onClose: () => void
  onConfirm: () => void
}

export function ValidationModal({ creatives, onClose, onConfirm }: ValidationModalProps) {
  const { platform } = useAppStore()
  
  // Enhanced validation with dimensions, format, and size
  const results = useMemo(() => {
    return creatives.map(c => {
      const errors: string[] = []
      const warnings: string[] = []
      
      // Size validation (approximate)
      const sizeKB = c.sizeKB || Math.round((c.imageUrl.length * 0.75) / 1024)
      const maxSize = platform === 'sklik' ? 150 : 5120
      
      if (sizeKB > maxSize) {
        errors.push(`Velikost ${sizeKB}kB překračuje limit ${maxSize}kB`)
      } else if (sizeKB > maxSize * 0.8) {
        warnings.push(`Velikost ${sizeKB}kB se blíží limitu ${maxSize}kB`)
      }
      
      // Dimension validation - check if actual matches expected
      const expectedWidth = c.format.width
      const expectedHeight = c.format.height
      
      // Create temp image to check actual dimensions
      const img = new Image()
      img.src = c.imageUrl
      const actualWidth = img.naturalWidth || expectedWidth
      const actualHeight = img.naturalHeight || expectedHeight
      
      if (actualWidth !== expectedWidth || actualHeight !== expectedHeight) {
        if (actualWidth > 0 && actualHeight > 0) {
          warnings.push(`Rozměry ${actualWidth}×${actualHeight} neodpovídají ${expectedWidth}×${expectedHeight}`)
        }
      }
      
      // Aspect ratio validation
      const expectedRatio = expectedWidth / expectedHeight
      const actualRatio = actualWidth / actualHeight
      const ratioDiff = Math.abs(expectedRatio - actualRatio)
      if (ratioDiff > 0.1 && actualWidth > 0) {
        warnings.push(`Poměr stran se liší (${actualRatio.toFixed(2)} vs ${expectedRatio.toFixed(2)})`)
      }
      
      // Format validation - check file type from data URL
      const formatMatch = c.imageUrl.match(/^data:image\/([\w+]+);/)
      const fileFormat = formatMatch ? formatMatch[1] : 'unknown'
      const allowedFormats = platform === 'sklik' 
        ? ['png', 'jpeg', 'jpg', 'gif'] 
        : ['png', 'jpeg', 'jpg', 'gif', 'webp']
      
      if (!allowedFormats.includes(fileFormat.toLowerCase())) {
        errors.push(`Formát ${fileFormat.toUpperCase()} není podporován`)
      }
      
      // Minimum dimension check
      const minDim = platform === 'sklik' ? 50 : 100
      if (expectedWidth < minDim || expectedHeight < minDim) {
        warnings.push(`Rozměry jsou menší než doporučené minimum ${minDim}px`)
      }
      
      return { 
        creative: c, 
        errors, 
        warnings, 
        sizeKB, 
        maxSize, 
        fileFormat,
        actualWidth,
        actualHeight
      }
    })
  }, [creatives, platform])
  
  const hasErrors = results.some(r => r.errors.length > 0)
  const errorCount = results.filter(r => r.errors.length > 0).length
  const warningCount = results.filter(r => r.warnings.length > 0).length
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 24,
        width: 500, maxWidth: '90%', maxHeight: '80vh', overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: hasErrors ? '#fee2e2' : '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {hasErrors ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              Validace před exportem
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.textSecondary }}>
              {creatives.length} kreativ • {errorCount} chyb • {warningCount} varování
            </p>
          </div>
        </div>
        
        <div style={{ 
          maxHeight: 300, overflow: 'auto', 
          border: `1px solid ${COLORS.border}`, borderRadius: 8,
          marginBottom: 20,
        }}>
          {results.map((r, i) => (
            <div key={r.creative.id} style={{
              padding: '12px 16px',
              borderBottom: i < results.length - 1 ? `1px solid ${COLORS.borderLight}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <img 
                src={r.creative.imageUrl} 
                alt=""
                style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {r.creative.format.width}×{r.creative.format.height}
                  <span style={{ 
                    marginLeft: 8, fontSize: 11, color: COLORS.textMuted,
                    textTransform: 'uppercase' 
                  }}>
                    {r.fileFormat}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {r.sizeKB}kB / {r.maxSize}kB
                </div>
                {r.errors.length > 0 && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                    {r.errors[0]}
                  </div>
                )}
                {r.errors.length === 0 && r.warnings.length > 0 && (
                  <div style={{ fontSize: 11, color: '#d97706', marginTop: 2 }}>
                    {r.warnings[0]}
                  </div>
                )}
              </div>
              <div>
                {r.errors.length > 0 && (
                  <span style={{ 
                    padding: '2px 8px', borderRadius: 4,
                    backgroundColor: '#fee2e2', color: '#ef4444',
                    fontSize: 11, fontWeight: 500,
                  }}>
                    Error
                  </span>
                )}
                {r.errors.length === 0 && r.warnings.length > 0 && (
                  <span style={{ 
                    padding: '2px 8px', borderRadius: 4,
                    backgroundColor: '#fef3c7', color: '#d97706',
                    fontSize: 11, fontWeight: 500,
                  }}>
                    Warning
                  </span>
                )}
                {r.errors.length === 0 && r.warnings.length === 0 && (
                  <span style={{ 
                    padding: '2px 8px', borderRadius: 4,
                    backgroundColor: '#dcfce7', color: '#22c55e',
                    fontSize: 11, fontWeight: 500,
                  }}>
                    OK
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, backgroundColor: 'transparent',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            Zrušit
          </button>
          <button 
            onClick={onConfirm}
            disabled={hasErrors}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: 8,
              backgroundColor: hasErrors ? COLORS.textMuted : COLORS.primary,
              color: 'white',
              fontSize: 14, fontWeight: 500,
              cursor: hasErrors ? 'not-allowed' : 'pointer',
            }}
          >
            {hasErrors ? 'Opravte chyby' : 'Exportovat'}
          </button>
        </div>
      </div>
    </div>
  )
}
