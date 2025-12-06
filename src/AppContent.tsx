/**
 * AdCreative Studio v7.0 - CLEAN REWRITE
 * 
 * CSS Grid layout s inline styly
 * Žádná závislost na Tailwind pro kritický layout
 * Hardcoded světlé barvy
 */

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { platforms, getFormatKey } from '@/lib/platforms'
import { loadImage, generateId } from '@/lib/utils'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { SettingsModal } from '@/components/SettingsModal'
import { GalleryView } from '@/components/GalleryView'
import type { PlatformId, Creative } from '@/types'

// ============================================================================
// DESIGN TOKENS - Hardcoded pro spolehlivost
// ============================================================================

const COLORS = {
  // Backgrounds
  pageBg: '#f3f4f6',        // gray-100
  cardBg: '#ffffff',
  sidebarBg: '#ffffff',
  
  // Text
  textPrimary: '#111827',   // gray-900
  textSecondary: '#6b7280', // gray-500
  textMuted: '#9ca3af',     // gray-400
  
  // Accents
  primary: '#2563eb',       // blue-600
  primaryHover: '#1d4ed8',  // blue-700
  primaryLight: '#eff6ff',  // blue-50
  
  success: '#22c55e',       // green-500
  
  // Borders
  border: '#e5e7eb',        // gray-200
  borderLight: '#f3f4f6',   // gray-100
}

const SIZES = {
  headerHeight: 56,
  footerHeight: 64,
  leftSidebar: 72,
  rightPanel: 400,
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export function AppContent() {
  const [currentView, setCurrentView] = useState<'editor' | 'gallery'>('editor')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { profile } = useAuth()

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'grid',
      gridTemplateRows: `${SIZES.headerHeight}px 1fr ${SIZES.footerHeight}px`,
      gridTemplateColumns: '1fr',
      backgroundColor: COLORS.pageBg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: COLORS.textPrimary,
    }}>
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <header style={{
        gridRow: 1,
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
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: COLORS.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 16 }}>AdCreative Studio</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 4 }}>
          <NavButton 
            active={currentView === 'editor'} 
            onClick={() => setCurrentView('editor')}
          >
            Generátor
          </NavButton>
          <NavButton 
            active={currentView === 'gallery'} 
            onClick={() => setCurrentView('gallery')}
          >
            Galerie
          </NavButton>
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <IconButton onClick={() => setSettingsOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </IconButton>

        {/* Divider */}
        <div style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.name || 'User'}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{profile?.email || ''}</div>
          </div>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: COLORS.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 14,
          }}>
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════════════ */}
      <main style={{ gridRow: 2, overflow: 'hidden' }}>
        {currentView === 'editor' ? (
          <EditorView />
        ) : (
          <div style={{ height: '100%', overflow: 'auto', padding: 24 }}>
            <GalleryView />
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════ */}
      <footer style={{
        gridRow: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        backgroundColor: COLORS.cardBg,
        borderTop: `1px solid ${COLORS.border}`,
        gap: 12,
      }}>
        <button
          onClick={() => setCurrentView('gallery')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: COLORS.primary,
            border: 'none',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          View Gallery
        </button>
        <button style={{
          padding: '10px 24px',
          backgroundColor: COLORS.primary,
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontWeight: 500,
          fontSize: 14,
          cursor: 'pointer',
        }}>
          Export
        </button>
      </footer>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

// ============================================================================
// EDITOR VIEW - 3 Column Layout
// ============================================================================

function EditorView() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${SIZES.leftSidebar}px 1fr ${SIZES.rightPanel}px`,
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Left Sidebar */}
      <LeftSidebar />
      
      {/* Center Content */}
      <CenterContent />
      
      {/* Right Panel */}
      <RightPanel />
    </div>
  )
}

// ============================================================================
// LEFT SIDEBAR - Steps
// ============================================================================

function LeftSidebar() {
  const { creatives } = useAppStore()
  const hasCreatives = Object.keys(creatives).length > 0

  return (
    <aside style={{
      backgroundColor: COLORS.cardBg,
      borderRight: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0',
      gap: 16,
    }}>
      <StepIndicator step={1} completed={hasCreatives} active />
      <StepIndicator step={2} completed={false} />
      
      <div style={{ flex: 1 }} />
      
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.textMuted,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
    </aside>
  )
}

function StepIndicator({ step, completed, active }: { step: number; completed: boolean; active?: boolean }) {
  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 600,
      backgroundColor: completed ? COLORS.success : 'transparent',
      color: completed ? 'white' : active ? COLORS.primary : COLORS.textMuted,
      border: completed ? 'none' : `2px solid ${active ? COLORS.primary : COLORS.border}`,
    }}>
      {completed ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : step}
    </div>
  )
}

// ============================================================================
// CENTER CONTENT - Main editor area
// ============================================================================

function CenterContent() {
  const {
    platform, category, setCategory,
    sourceImage, setSourceImage,
    selectedFormats, toggleFormat, selectAllFormats,
    creatives, addCreatives,
    isGenerating, setIsGenerating, progress, setProgress,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform?.categories[category]
  const formats = currentCategory?.formats || []
  const creativesArray = Object.values(creatives)

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setSourceImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [setSourceImage])

  const handleGenerate = useCallback(async () => {
    if (!sourceImage || selectedFormats.size === 0) return
    
    setIsGenerating(true)
    setProgress(0)
    
    try {
      const img = await loadImage(sourceImage)
      const formatKeys = Array.from(selectedFormats)
      const newCreatives: Creative[] = []
      
      for (let i = 0; i < formatKeys.length; i++) {
        const formatKey = formatKeys[i]
        const [plat, cat, idx] = formatKey.split('_')
        const fmt = platforms[plat as PlatformId]?.categories[cat]?.formats[parseInt(idx)]
        if (!fmt) continue
        
        setProgress(Math.round(((i + 0.5) / formatKeys.length) * 100))
        
        const canvas = document.createElement('canvas')
        canvas.width = fmt.width
        canvas.height = fmt.height
        const ctx = canvas.getContext('2d')!
        
        const crop = await calculateSmartCrop(sourceImage, fmt.width, fmt.height)
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, fmt.width, fmt.height)
        
        newCreatives.push({
          id: generateId(),
          formatKey,
          platform: plat as PlatformId,
          category: cat,
          format: fmt,
          imageUrl: canvas.toDataURL('image/png'),
          createdAt: new Date(),
          sizeKB: 0,
        })
        
        setProgress(Math.round(((i + 1) / formatKeys.length) * 100))
      }
      
      addCreatives(newCreatives)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }, [sourceImage, selectedFormats, setIsGenerating, setProgress, addCreatives])

  return (
    <div style={{
      backgroundColor: COLORS.pageBg,
      overflow: 'auto',
      padding: 24,
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {currentPlatform && Object.entries(currentPlatform.categories).slice(0, 4).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: `1px solid ${category === key ? COLORS.textSecondary : COLORS.border}`,
                backgroundColor: category === key ? COLORS.cardBg : 'transparent',
                color: category === key ? COLORS.textPrimary : COLORS.textSecondary,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: category === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {cat.name}
            </button>
          ))}
          <button style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            backgroundColor: 'transparent',
            color: COLORS.primary,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            View more →
          </button>
        </div>

        {/* ═══ IMAGES CARD ═══ */}
        <Card>
          <CardHeader 
            title="Images" 
            count={`${creativesArray.length}/20`}
            completed={creativesArray.length > 0}
          />
          
          {/* Thumbnails */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {sourceImage && (
                <Thumbnail src={sourceImage} />
              )}
              {creativesArray.slice(0, 4).map((c) => (
                <Thumbnail key={c.id} src={c.imageUrl} />
              ))}
              {creativesArray.length > 4 && (
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: COLORS.textPrimary,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  +{creativesArray.length - 4}
                </div>
              )}
              {!sourceImage && (
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  border: `2px dashed ${COLORS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textMuted,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <SecondaryButton onClick={() => fileInputRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {sourceImage ? 'Change' : 'Upload'}
              </SecondaryButton>
              <PrimaryLightButton 
                onClick={handleGenerate}
                disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {isGenerating ? `Generating ${progress}%` : 'Generate images'}
              </PrimaryLightButton>
            </div>
          </div>

          {/* Format Grid */}
          <div style={{ padding: 20 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16 
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textSecondary }}>
                Recommended formats
              </span>
              <button
                onClick={() => selectAllFormats(formats.map((_, i) => getFormatKey(platform, category, i)))}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 6,
                }}
              >
                Select all
              </button>
            </div>

            {/* 4-column grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
            }}>
              {formats.slice(0, 8).map((format, index) => {
                const formatKey = getFormatKey(platform, category, index)
                const isSelected = selectedFormats.has(formatKey)
                
                return (
                  <FormatCard
                    key={formatKey}
                    format={format}
                    selected={isSelected}
                    sourceImage={sourceImage}
                    onClick={() => toggleFormat(formatKey)}
                    label={['From URL', 'Generated', 'Enhanced', 'Stock'][index % 4]}
                  />
                )
              })}
            </div>
          </div>
        </Card>

        {/* ═══ LOGOS CARD ═══ */}
        <Card style={{ marginTop: 24 }}>
          <CardHeader title="Logos" count="4/5" completed />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: COLORS.pageBg,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
              }}>
                LOGO
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: COLORS.textPrimary,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}>
                L
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8,
                color: COLORS.textMuted,
              }}>
                LOGO
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: `2px dashed ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.textMuted,
                cursor: 'pointer',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            </div>
            <SecondaryButton>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </SecondaryButton>
          </div>
        </Card>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}

// ============================================================================
// RIGHT PANEL - Preview
// ============================================================================

function RightPanel() {
  const { sourceImage, textOverlay } = useAppStore()
  const [activeChannel, setActiveChannel] = useState('display')
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile')

  const channels = ['YouTube', 'Gmail', 'Search', 'Display', 'Discover', 'Maps']

  return (
    <aside style={{
      backgroundColor: COLORS.cardBg,
      borderLeft: `1px solid ${COLORS.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Ad Strength */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: `1px solid ${COLORS.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `3px solid ${COLORS.success}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Ad Strength</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.success }}>Excellent</div>
        </div>
      </div>

      {/* Preview Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Preview</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconButton 
              small 
              active={deviceType === 'mobile'}
              onClick={() => setDeviceType('mobile')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </IconButton>
            <IconButton 
              small 
              active={deviceType === 'desktop'}
              onClick={() => setDeviceType('desktop')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </IconButton>
          </div>
        </div>

        {/* Channel tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {channels.map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch.toLowerCase())}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: 'none',
                borderRadius: 6,
                backgroundColor: activeChannel === ch.toLowerCase() ? COLORS.primaryLight : 'transparent',
                color: activeChannel === ch.toLowerCase() ? COLORS.primary : COLORS.textSecondary,
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Mockup */}
      <div style={{
        flex: 1,
        padding: 24,
        backgroundColor: COLORS.pageBg,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'auto',
      }}>
        <div style={{
          width: deviceType === 'mobile' ? 240 : 320,
          backgroundColor: COLORS.cardBg,
          borderRadius: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}>
          {/* Notch */}
          {deviceType === 'mobile' && (
            <div style={{
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.cardBg,
            }}>
              <div style={{
                width: 60,
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.border,
              }} />
            </div>
          )}

          {/* Image */}
          <div style={{ position: 'relative' }}>
            {sourceImage ? (
              <img 
                src={sourceImage} 
                alt="" 
                style={{ 
                  width: '100%', 
                  aspectRatio: deviceType === 'mobile' ? '3/4' : '16/9',
                  objectFit: 'cover',
                  display: 'block',
                }} 
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: deviceType === 'mobile' ? '3/4' : '16/9',
                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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

            {/* Text Overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '48px 16px 16px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            }}>
              <div style={{ 
                fontSize: 10, 
                fontWeight: 700, 
                color: 'white', 
                opacity: 0.8,
                marginBottom: 4,
              }}>
                BRAND
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                color: 'white',
                lineHeight: 1.3,
                marginBottom: 4,
              }}>
                {textOverlay.headline || 'Your headline here'}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.4,
              }}>
                {textOverlay.subheadline || 'Your description text goes here'}
              </div>
            </div>

            {/* Close button */}
            <button style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Ad indicator */}
          <div style={{
            padding: '8px 0',
            textAlign: 'center',
            borderTop: `1px solid ${COLORS.borderLight}`,
          }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>
              Ad ▾
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

function NavButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderRadius: 8,
        backgroundColor: active ? COLORS.primaryLight : 'transparent',
        color: active ? COLORS.primary : COLORS.textSecondary,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function IconButton({ children, onClick, small, active }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  small?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: small ? 32 : 40,
        height: small ? 32 : 40,
        border: 'none',
        borderRadius: 8,
        backgroundColor: active ? COLORS.pageBg : 'transparent',
        color: active ? COLORS.textPrimary : COLORS.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: COLORS.cardBg,
      borderRadius: 12,
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardHeader({ title, count, completed }: { title: string; count: string; completed?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: `1px solid ${COLORS.borderLight}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: completed ? COLORS.success : 'transparent',
          border: completed ? 'none' : `2px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}>
          {completed && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title} ({count})</span>
      </div>
      <button style={{
        width: 28,
        height: 28,
        border: 'none',
        backgroundColor: 'transparent',
        color: COLORS.textMuted,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
    </div>
  )
}

function Thumbnail({ src }: { src: string }) {
  return (
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 8,
      overflow: 'hidden',
      border: `1px solid ${COLORS.border}`,
    }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        backgroundColor: COLORS.cardBg,
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function PrimaryLightButton({ children, onClick, disabled }: { 
  children: React.ReactNode; 
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        border: `1px solid ${COLORS.primary}`,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function FormatCard({ format, selected, sourceImage, onClick, label }: {
  format: { width: number; height: number };
  selected: boolean;
  sourceImage: string | null;
  onClick: () => void;
  label: string;
}) {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{
        position: 'relative',
        aspectRatio: '4/3',
        borderRadius: 8,
        overflow: 'hidden',
        border: `2px solid ${selected ? COLORS.primary : COLORS.border}`,
        boxShadow: selected ? `0 0 0 2px ${COLORS.primaryLight}` : 'none',
      }}>
        {sourceImage ? (
          <img src={sourceImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.pageBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.textMuted,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        )}

        {/* Checkbox */}
        <div style={{
          position: 'absolute',
          top: 6,
          left: 6,
          width: 20,
          height: 20,
          borderRadius: 4,
          backgroundColor: selected ? COLORS.primary : COLORS.cardBg,
          border: selected ? 'none' : `1.5px solid ${COLORS.textMuted}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {selected && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>

        {/* Size badge */}
        <div style={{
          position: 'absolute',
          bottom: 6,
          right: 6,
          padding: '2px 6px',
          borderRadius: 4,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: 10,
          fontWeight: 500,
        }}>
          {format.width}×{format.height}
        </div>
      </div>

      {/* Label */}
      <div style={{
        marginTop: 8,
        fontSize: 12,
        color: COLORS.textSecondary,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
        {label}
      </div>
    </div>
  )
}

export default AppContent