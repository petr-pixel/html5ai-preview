import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { COLORS } from '@/lib/design-tokens'

type ViewType = 'editor' | 'gallery' | 'scoring' | 'copywriter' | 'branding' | 'video' | 'export' | 'admin'

interface NavItem {
  id: ViewType
  label: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'gallery', label: 'Galerie' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'copywriter', label: 'AI Copy' },
  { id: 'branding', label: 'Brand Kit' },
  { id: 'video', label: 'Video' },
  { id: 'export', label: 'Export' },
  { id: 'admin', label: 'Admin', adminOnly: true },
]

interface AppHeaderProps {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  isGenerating: boolean
  progress: number
  isSaving: boolean
  lastSaved: Date | null
  canUndo: boolean
  canRedo: boolean
  handleUndo: () => void
  handleRedo: () => void
  onOpenShortcuts: () => void
  onOpenHistory: () => void
  onOpenSettings: () => void
  onStartTour: () => void
}

export function AppHeader({
  currentView,
  setCurrentView,
  isGenerating,
  progress,
  isSaving,
  lastSaved,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  onOpenShortcuts,
  onOpenHistory,
  onOpenSettings,
  onStartTour,
}: AppHeaderProps) {
  const { platform, setPlatform, creatives } = useAppStore()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const creativesArray = Object.values(creatives)

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      backgroundColor: COLORS.cardBg,
      borderBottom: `1px solid ${COLORS.border}`,
      gap: 16,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: COLORS.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
        </div>
        <span style={{ fontWeight: 600, fontSize: 16 }}>AdCreative Studio</span>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px',
          backgroundColor: '#fef3c7',
          borderRadius: 20,
          animation: 'pulse 2s infinite',
        }}>
          <div style={{
            width: 8, height: 8,
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
            animation: 'pulse 1s infinite',
          }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#92400e' }}>
            Generuji... {progress}%
          </span>
          <div style={{
            width: 60, height: 4,
            backgroundColor: '#fde68a',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#f59e0b',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Auto-save Indicator */}
      {(isSaving || lastSaved) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          backgroundColor: isSaving ? '#fef3c7' : '#dcfce7',
          borderRadius: 16,
          fontSize: 11,
          color: isSaving ? '#92400e' : '#166534',
        }}>
          {isSaving ? (
            <>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: '#f59e0b',
                animation: 'pulse 1s infinite',
              }} />
              <span>Ukládám...</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Uloženo {lastSaved?.toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          )}
        </div>
      )}

      {/* Platform Switcher */}
      <div style={{ 
        display: 'flex', alignItems: 'center', 
        backgroundColor: COLORS.pageBg, borderRadius: 8, padding: 4,
      }}>
        <button
          onClick={() => setPlatform('sklik')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: platform === 'sklik' ? COLORS.cardBg : 'transparent',
            color: platform === 'sklik' ? '#f97316' : COLORS.textSecondary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: platform === 'sklik' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>🟠</span>
          Sklik
        </button>
        <button
          onClick={() => setPlatform('google')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: platform === 'google' ? COLORS.cardBg : 'transparent',
            color: platform === 'google' ? '#2563eb' : COLORS.textSecondary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: platform === 'google' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>🔵</span>
          Google
        </button>
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {navItems.filter(n => !n.adminOnly || isAdmin).map(nav => (
          <button
            key={nav.id}
            onClick={() => setCurrentView(nav.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              backgroundColor: currentView === nav.id ? COLORS.primaryLight : 'transparent',
              color: currentView === nav.id ? COLORS.primary : COLORS.textSecondary,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {nav.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Tour Button */}
      <button
        onClick={onStartTour}
        title="Spustit průvodce"
        style={{
          width: 36, height: 36, border: `1px solid ${COLORS.border}`, borderRadius: 8,
          backgroundColor: 'transparent',
          color: COLORS.textSecondary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        🎯
      </button>

      {/* Keyboard Shortcuts */}
      <button
        onClick={onOpenShortcuts}
        title="Klávesové zkratky (stiskněte ?)"
        style={{
          width: 36, height: 36, border: `1px solid ${COLORS.border}`, borderRadius: 8,
          backgroundColor: 'transparent',
          color: COLORS.textSecondary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 16, fontWeight: 600,
        }}
      >
        ?
      </button>

      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Zpět (⌘Z)"
          style={{
            width: 32, height: 32, border: 'none', borderRadius: 6,
            backgroundColor: canUndo ? COLORS.pageBg : COLORS.borderLight,
            color: canUndo ? COLORS.textSecondary : COLORS.textMuted,
            cursor: canUndo ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: canUndo ? 1 : 0.5,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Vpřed (⌘Y)"
          style={{
            width: 32, height: 32, border: 'none', borderRadius: 6,
            backgroundColor: canRedo ? COLORS.pageBg : COLORS.borderLight,
            color: canRedo ? COLORS.textSecondary : COLORS.textMuted,
            cursor: canRedo ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: canRedo ? 1 : 0.5,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
          </svg>
        </button>
      </div>

      {/* Creatives Badge */}
      {creativesArray.length > 0 && (
        <div 
          onClick={onOpenHistory}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            backgroundColor: COLORS.primaryLight,
            borderRadius: 20,
            cursor: 'pointer',
          }}
          title="Zobrazit historii kreativ"
        >
          <span style={{ fontSize: 14 }}>🖼️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}>
            {creativesArray.length}
          </span>
        </div>
      )}

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        style={{
          width: 40, height: 40, border: 'none', borderRadius: 8,
          backgroundColor: 'transparent',
          color: COLORS.textSecondary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>

      <div style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />

      {/* User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.name || 'User'}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{profile?.email || ''}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          backgroundColor: COLORS.primary, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 14,
        }}>
          {profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
