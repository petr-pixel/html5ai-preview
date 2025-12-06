import { useState, useEffect } from 'react'
import type { Creative } from '@/types'

interface ComparisonModalProps {
  creatives: Creative[]
  onClose: () => void
}

export function ComparisonModal({ creatives, onClose }: ComparisonModalProps) {
  const [leftIndex, setLeftIndex] = useState(0)
  const [rightIndex, setRightIndex] = useState(Math.min(1, creatives.length - 1))
  const [zoomLevel, setZoomLevel] = useState(100)
  
  const leftCreative = creatives[leftIndex]
  const rightCreative = creatives[rightIndex]
  
  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setLeftIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setRightIndex(i => Math.min(creatives.length - 1, i + 1))
      if (e.key === '+' || e.key === '=') setZoomLevel(z => Math.min(200, z + 25))
      if (e.key === '-') setZoomLevel(z => Math.max(50, z - 25))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, creatives.length])
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column',
      zIndex: 1100,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'white' }}>
            🔍 Porovnání kreativ
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {creatives.length} kreativ
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => setZoomLevel(z => Math.max(50, z - 25))}
              style={{
                width: 28, height: 28, border: 'none', borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.1)', color: 'white',
                cursor: 'pointer', fontSize: 16,
              }}
            >−</button>
            <span style={{ color: 'white', fontSize: 13, minWidth: 50, textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button 
              onClick={() => setZoomLevel(z => Math.min(200, z + 25))}
              style={{
                width: 28, height: 28, border: 'none', borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.1)', color: 'white',
                cursor: 'pointer', fontSize: 16,
              }}
            >+</button>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              width: 36, height: 36, border: 'none', borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.1)', color: 'white',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Comparison Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
            {leftCreative && (
              <img 
                src={leftCreative.imageUrl}
                alt=""
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel / 100})`,
                  transition: 'transform 0.2s',
                }}
              />
            )}
          </div>
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={leftIndex}
              onChange={(e) => setLeftIndex(Number(e.target.value))}
              style={{
                flex: 1, padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: 6, color: 'white', fontSize: 13,
              }}
            >
              {creatives.map((c, i) => (
                <option key={c.id} value={i} style={{ backgroundColor: '#1f2937' }}>
                  {c.format.width}×{c.format.height} - {c.format.name}
                </option>
              ))}
            </select>
            {leftCreative && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {leftCreative.sizeKB || '?'} KB
              </span>
            )}
          </div>
        </div>
        
        {/* Right Side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
            {rightCreative && (
              <img 
                src={rightCreative.imageUrl}
                alt=""
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel / 100})`,
                  transition: 'transform 0.2s',
                }}
              />
            )}
          </div>
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={rightIndex}
              onChange={(e) => setRightIndex(Number(e.target.value))}
              style={{
                flex: 1, padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: 6, color: 'white', fontSize: 13,
              }}
            >
              {creatives.map((c, i) => (
                <option key={c.id} value={i} style={{ backgroundColor: '#1f2937' }}>
                  {c.format.width}×{c.format.height} - {c.format.name}
                </option>
              ))}
            </select>
            {rightCreative && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {rightCreative.sizeKB || '?'} KB
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with tips */}
      <div style={{ 
        padding: '12px 24px', 
        backgroundColor: 'rgba(255,255,255,0.05)',
        display: 'flex', 
        justifyContent: 'center', 
        gap: 24,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
      }}>
        <span>← → Procházet kreativy</span>
        <span>+ − Zoom</span>
        <span>Esc Zavřít</span>
      </div>
    </div>
  )
}
