import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'

export function RecentImagesPanel() {
  const { setSourceImage, sourceImage } = useAppStore()
  const [recentImages, setRecentImages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('adcreative_recent_images')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  
  // Add current image to recent when it changes
  useEffect(() => {
    if (sourceImage && !recentImages.includes(sourceImage)) {
      const updated = [sourceImage, ...recentImages].slice(0, 6)
      setRecentImages(updated)
      try {
        localStorage.setItem('adcreative_recent_images', JSON.stringify(updated))
      } catch { /* storage full */ }
    }
  }, [sourceImage, recentImages])
  
  if (recentImages.length === 0) return null
  
  return (
    <div style={{ 
      padding: 16, 
      borderTop: `1px solid ${COLORS.borderLight}`,
      marginTop: 'auto',
    }}>
      <div style={{ 
        fontSize: 12, 
        fontWeight: 600, 
        color: COLORS.textMuted,
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>Nedávné obrázky</span>
        <button
          onClick={() => {
            setRecentImages([])
            localStorage.removeItem('adcreative_recent_images')
          }}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            color: COLORS.textMuted,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Vymazat
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {recentImages.slice(0, 6).map((img, i) => (
          <button
            key={i}
            onClick={() => setSourceImage(img)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              overflow: 'hidden',
              border: `2px solid ${img === sourceImage ? COLORS.primary : COLORS.border}`,
              padding: 0,
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img 
              src={img} 
              alt={`Recent ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
