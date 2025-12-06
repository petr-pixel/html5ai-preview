import { useAppStore } from '@/stores/app-store'
import { platforms } from '@/lib/platforms'
import { COLORS } from '@/lib/design-tokens'
import { SidebarButton, StepIndicator } from '@/components/shared/UIComponents'

interface LeftSidebarProps {
  onMagicResize: () => void
  onOpenTemplates: () => void
  onChangeView: (view: string) => void
}

export function LeftSidebar({ onMagicResize, onOpenTemplates, onChangeView }: LeftSidebarProps) {
  const { 
    platform, category, setCategory, 
    creatives, sourceImage, selectedFormats 
  } = useAppStore()
  const hasImage = !!sourceImage
  const hasCreatives = Object.keys(creatives).length > 0
  const currentPlatform = platforms[platform]
  const categories = currentPlatform ? Object.entries(currentPlatform.categories) : []

  return (
    <aside style={{
      backgroundColor: COLORS.cardBg,
      borderRight: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Progress Steps */}
      <div style={{ 
        padding: 16, 
        borderBottom: `1px solid ${COLORS.borderLight}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <StepIndicator step={1} completed={hasImage} active={!hasImage} />
        <div style={{ 
          flex: 1, height: 2, 
          backgroundColor: hasImage ? COLORS.success : COLORS.border,
          borderRadius: 1,
        }} />
        <StepIndicator step={2} completed={hasCreatives} active={hasImage && !hasCreatives} />
      </div>
      
      {/* Categories */}
      <div data-tour="formats" style={{ padding: '12px 8px', flex: 1, overflow: 'auto' }}>
        <div style={{ 
          fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
          padding: '0 8px', marginBottom: 8, textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Formáty
        </div>
        
        {categories.slice(0, 6).map(([key, cat]) => {
          const isActive = category === key
          const formatCount = cat.formats.length
          
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: isActive ? COLORS.primaryLight : 'transparent',
                color: isActive ? COLORS.primary : COLORS.textSecondary,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 16 }}>{cat.icon || '📐'}</span>
              <span style={{ flex: 1 }}>{cat.name}</span>
              <span style={{ 
                fontSize: 11, 
                color: isActive ? COLORS.primary : COLORS.textMuted,
                backgroundColor: isActive ? 'white' : COLORS.pageBg,
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                {formatCount}
              </span>
            </button>
          )
        })}
        
        {/* AI Tools Section */}
        <div 
          data-tour="ai-tools"
          style={{ 
            fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
            padding: '16px 8px 8px', textTransform: 'uppercase',
            letterSpacing: 0.5,
            borderTop: `1px solid ${COLORS.borderLight}`,
            marginTop: 12,
          }}
        >
          AI Nástroje
        </div>
        
        <SidebarButton icon="✨" label="Magic Resize" badge="NEW" onClick={onMagicResize} />
        <SidebarButton icon="📋" label="Templates" badge="15" onClick={onOpenTemplates} />
        <SidebarButton icon="📝" label="Copywriter" onClick={() => onChangeView('copywriter')} />
        <SidebarButton icon="🎨" label="Brand Kit" onClick={() => onChangeView('branding')} />
        <SidebarButton icon="📊" label="Scoring" onClick={() => onChangeView('scoring')} />
      </div>
      
      {/* Bottom Stats */}
      <div style={{ 
        padding: 16, 
        borderTop: `1px solid ${COLORS.borderLight}`,
        backgroundColor: COLORS.pageBg,
      }}>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>
          Vybráno formátů
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {selectedFormats.size}
        </div>
      </div>
    </aside>
  )
}
