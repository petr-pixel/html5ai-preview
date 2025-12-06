import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'
import { ColorPaletteExtractor } from '@/components/ColorPaletteExtractor'
import { RecentImagesPanel } from '@/components/RecentImagesPanel'
import { IconButton } from '@/components/shared/UIComponents'

interface RightPanelProps {
  onOpenTextEditor: () => void
}

export function RightPanel({ onOpenTextEditor }: RightPanelProps) {
  const { sourceImage, textOverlay, selectedFormats, creatives } = useAppStore()
  const [activeChannel, setActiveChannel] = useState('display')
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile')
  
  const creativesArray = Object.values(creatives)
  const channels = ['YouTube', 'Gmail', 'Search', 'Display', 'Discover', 'Maps']

  const getAdStrength = () => {
    let score = 0
    if (sourceImage) score += 30
    if (selectedFormats.size > 0) score += 20
    if (selectedFormats.size >= 3) score += 10
    if (textOverlay.headline) score += 20
    if (textOverlay.subheadline) score += 10
    if (creativesArray.length > 0) score += 10
    
    if (score >= 80) return { label: 'Excellent', color: COLORS.success }
    if (score >= 60) return { label: 'Good', color: '#eab308' }
    if (score >= 40) return { label: 'Average', color: '#f97316' }
    return { label: 'Poor', color: '#ef4444' }
  }
  
  const strength = getAdStrength()

  return (
    <aside 
      data-tour="preview"
      style={{
        backgroundColor: COLORS.cardBg,
        borderLeft: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Ad Strength */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: `1px solid ${COLORS.borderLight}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: `3px solid ${strength.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={strength.color} strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Ad Strength</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: strength.color }}>{strength.label}</div>
        </div>
      </div>

      {/* Preview Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Preview</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconButton small active={deviceType === 'mobile'} onClick={() => setDeviceType('mobile')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </IconButton>
            <IconButton small active={deviceType === 'desktop'} onClick={() => setDeviceType('desktop')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </IconButton>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          {channels.map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch.toLowerCase())}
              style={{
                flex: 1, padding: '8px 4px', border: 'none', borderRadius: 6,
                backgroundColor: activeChannel === ch.toLowerCase() ? COLORS.primaryLight : 'transparent',
                color: activeChannel === ch.toLowerCase() ? COLORS.primary : COLORS.textSecondary,
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Mockup */}
      <div style={{
        flex: 1, padding: 24, backgroundColor: COLORS.pageBg,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto',
      }}>
        <div style={{
          width: deviceType === 'mobile' ? 240 : 320,
          backgroundColor: COLORS.cardBg,
          borderRadius: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}>
          {deviceType === 'mobile' && (
            <div style={{
              height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 60, height: 4, borderRadius: 2, backgroundColor: COLORS.border }} />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            {sourceImage ? (
              <img src={sourceImage} alt="" style={{ 
                width: '100%', 
                aspectRatio: deviceType === 'mobile' ? '3/4' : '16/9',
                objectFit: 'cover', display: 'block',
              }} />
            ) : (
              <div style={{
                width: '100%', aspectRatio: deviceType === 'mobile' ? '3/4' : '16/9',
                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.6 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>Upload image</div>
                </div>
              </div>
            )}

            <div 
              onClick={onOpenTextEditor}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '48px 16px 16px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: 'white', opacity: 0.8, marginBottom: 4 }}>
                BRAND
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 4 }}>
                {textOverlay.headline || 'Click to edit headline'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                {textOverlay.subheadline || 'Click to edit description'}
              </div>
            </div>

            <button style={{
              position: 'absolute', top: 8, right: 8,
              width: 24, height: 24, borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div style={{ padding: '8px 0', textAlign: 'center', borderTop: `1px solid ${COLORS.borderLight}` }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>Ad ▾</span>
          </div>
        </div>
      </div>
      
      {/* Color Palette */}
      <ColorPaletteExtractor />
      
      {/* Recent Images */}
      <RecentImagesPanel />
    </aside>
  )
}
