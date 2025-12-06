import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'

export function ColorPaletteExtractor() {
  const { sourceImage } = useAppStore()
  const [colors, setColors] = useState<string[]>([])
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  
  // Extract dominant colors from source image
  useEffect(() => {
    if (!sourceImage) {
      setColors([])
      return
    }
    
    const extractColors = async () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Sample a smaller version for performance
        const sampleSize = 50
        canvas.width = sampleSize
        canvas.height = sampleSize
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
        
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data
        const colorMap: Record<string, number> = {}
        
        // Sample pixels and count colors
        for (let i = 0; i < imageData.length; i += 16) {
          const r = Math.round(imageData[i] / 32) * 32
          const g = Math.round(imageData[i + 1] / 32) * 32
          const b = Math.round(imageData[i + 2] / 32) * 32
          const key = `${r},${g},${b}`
          colorMap[key] = (colorMap[key] || 0) + 1
        }
        
        // Sort by frequency and get top colors
        const sortedColors = Object.entries(colorMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([rgb]) => {
            const [r, g, b] = rgb.split(',').map(Number)
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
          })
        
        setColors(sortedColors)
      }
      
      img.src = sourceImage
    }
    
    extractColors()
  }, [sourceImage])
  
  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 1500)
  }
  
  if (colors.length === 0) return null
  
  return (
    <div style={{ 
      padding: 16, 
      borderTop: `1px solid ${COLORS.borderLight}`,
    }}>
      <div style={{ 
        fontSize: 12, 
        fontWeight: 600, 
        color: COLORS.textMuted,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>🎨</span>
        <span>Paleta barev</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {colors.map((color, i) => (
          <button
            key={i}
            onClick={() => copyToClipboard(color)}
            title={`${color} - Klikni pro zkopírování`}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: color,
              border: copiedColor === color ? '2px solid #10b981' : '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s',
              position: 'relative',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {copiedColor === color && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(16, 185, 129, 0.9)',
                borderRadius: 4,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
        Klikni pro zkopírování HEX kódu
      </div>
    </div>
  )
}
