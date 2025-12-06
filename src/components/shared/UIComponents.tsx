import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { COLORS } from '@/lib/design-tokens'

export function IconButton({ children, onClick, small, active }: { 
  children: React.ReactNode
  onClick?: () => void
  small?: boolean
  active?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      width: small ? 32 : 40, height: small ? 32 : 40,
      border: 'none', borderRadius: 8,
      backgroundColor: active ? COLORS.pageBg : 'transparent',
      color: active ? COLORS.textPrimary : COLORS.textSecondary,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      {children}
    </button>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: COLORS.cardBg, borderRadius: 12,
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, count, completed }: { title: string; count: string; completed?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: `1px solid ${COLORS.borderLight}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          backgroundColor: completed ? COLORS.success : 'transparent',
          border: completed ? 'none' : `2px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          {completed && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>{title}</span>
      </div>
      <span style={{ 
        fontSize: 13, color: COLORS.textMuted, 
        padding: '4px 10px', backgroundColor: COLORS.pageBg, borderRadius: 8,
      }}>
        {count}
      </span>
    </div>
  )
}

export function Thumbnail({ src, label, onClick }: { src: string; label?: string; onClick?: () => void }) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewPos, setPreviewPos] = useState({ top: 0, left: 0 })
  const thumbRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    if (showPreview && thumbRef.current) {
      const rect = thumbRef.current.getBoundingClientRect()
      const previewWidth = 240
      const previewHeight = 180
      
      let left = rect.right + 12
      let top = rect.top
      
      if (left + previewWidth > window.innerWidth) {
        left = rect.left - previewWidth - 12
      }
      if (top + previewHeight > window.innerHeight) {
        top = window.innerHeight - previewHeight - 12
      }
      
      setPreviewPos({ top, left })
    }
  }, [showPreview])
  
  return (
    <>
      <button
        ref={thumbRef}
        onClick={onClick}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        style={{
          width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
          border: `2px solid ${COLORS.border}`, padding: 0, cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
        }}
      >
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </button>
      
      {showPreview && createPortal(
        <div style={{
          position: 'fixed',
          top: previewPos.top,
          left: previewPos.left,
          width: 240,
          backgroundColor: 'white',
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 1000,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <img 
            src={src} 
            alt="" 
            style={{ width: '100%', height: 'auto', display: 'block' }} 
          />
          {label && (
            <div style={{ 
              padding: '8px 12px', 
              fontSize: 12, 
              color: COLORS.textSecondary,
              borderTop: `1px solid ${COLORS.borderLight}`,
            }}>
              {label}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

export function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', border: `1px solid ${COLORS.border}`,
      borderRadius: 8, backgroundColor: COLORS.cardBg,
      color: COLORS.textPrimary, fontSize: 14, fontWeight: 500, cursor: 'pointer',
    }}>
      {children}
    </button>
  )
}

export function PrimaryLightButton({ children, onClick, disabled }: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', border: `1px solid ${COLORS.primary}`,
      borderRadius: 8, backgroundColor: COLORS.primaryLight,
      color: COLORS.primary, fontSize: 14, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  )
}

export function FormatCard({ format, selected, sourceImage, onClick, onDoubleClick, label }: {
  format: { width: number; height: number; name?: string }
  selected: boolean
  sourceImage: string | null
  onClick: () => void
  onDoubleClick?: () => void
  label: string
}) {
  return (
    <div 
      onClick={onClick} 
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
      title={sourceImage ? 'Double-click to edit' : 'Upload image first'}
    >
      <div style={{
        position: 'relative', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden',
        border: `2px solid ${selected ? COLORS.primary : COLORS.border}`,
        boxShadow: selected ? `0 0 0 2px ${COLORS.primaryLight}` : 'none',
        transition: 'all 0.15s',
      }}>
        {sourceImage ? (
          <img src={sourceImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', backgroundColor: COLORS.pageBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.textMuted,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        )}

        <div style={{
          position: 'absolute', top: 6, left: 6,
          width: 20, height: 20, borderRadius: 4,
          backgroundColor: selected ? COLORS.primary : COLORS.cardBg,
          border: selected ? 'none' : `1.5px solid ${COLORS.textMuted}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {selected && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>

        {sourceImage && (
          <div 
            onClick={(e) => { e.stopPropagation(); onDoubleClick?.() }}
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 24, height: 24, borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.7,
              transition: 'opacity 0.15s',
            }}
            title="Edit format"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 6, right: 6,
          padding: '2px 6px', borderRadius: 4,
          backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
          fontSize: 10, fontWeight: 500,
        }}>
          {format.width}×{format.height}
        </div>
      </div>

      <div style={{
        marginTop: 8, fontSize: 12, color: COLORS.textSecondary,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
        {format.name || label}
      </div>
    </div>
  )
}

export function SidebarButton({ icon, label, badge, onClick }: { 
  icon: string
  label: string
  badge?: string
  onClick?: () => void 
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%',
      padding: '10px 12px',
      border: 'none',
      borderRadius: 8,
      backgroundColor: 'transparent',
      color: COLORS.textSecondary,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      textAlign: 'left',
      marginBottom: 2,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ 
          fontSize: 9, fontWeight: 700,
          color: 'white',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}

export function StepIndicator({ step, completed, active }: { 
  step: number
  completed: boolean
  active?: boolean 
}) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 600,
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

export function ViewWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24 }}>
      {children}
    </div>
  )
}
