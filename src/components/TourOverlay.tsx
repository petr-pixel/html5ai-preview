import { useState, useEffect, useRef } from 'react'
import { COLORS } from '@/lib/design-tokens'

export interface TourStep {
  target: string
  selector?: string // CSS selector for spotlight
  title: string
  desc: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'upload',
    selector: '[data-tour="upload"]',
    title: '1. Nahrajte obrázek',
    desc: 'Přetáhněte obrázek sem nebo klikněte pro výběr. Podporujeme PNG, JPG a WebP.',
    position: 'right',
  },
  {
    target: 'formats',
    selector: '[data-tour="formats"]',
    title: '2. Vyberte formáty',
    desc: 'V levém panelu vyberte kategorie a formáty, které chcete vygenerovat.',
    position: 'right',
  },
  {
    target: 'ai-tools',
    selector: '[data-tour="ai-tools"]',
    title: '3. AI Nástroje',
    desc: 'Použijte Magic Resize pro automatické přizpůsobení, nebo Templates pro rychlé šablony.',
    position: 'right',
  },
  {
    target: 'preview',
    selector: '[data-tour="preview"]',
    title: '4. Náhled a úpravy',
    desc: 'V pravém panelu vidíte náhled reklamy. Můžete přidat texty a CTA tlačítka.',
    position: 'left',
  },
  {
    target: 'export',
    selector: '[data-tour="export"]',
    title: '5. Export',
    desc: 'Až budete hotovi, klikněte na Exportovat pro stažení všech kreativ jako ZIP.',
    position: 'bottom',
  },
]

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

export function TourOverlay({ 
  step, 
  onNext, 
  onSkip,
  onPrev,
}: { 
  step: number
  onNext: () => void
  onSkip: () => void
  onPrev?: () => void
}) {
  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const isFirst = step === 0
  const progress = ((step + 1) / TOUR_STEPS.length) * 100
  
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Find and measure the target element
  useEffect(() => {
    if (!current?.selector) {
      setSpotlight(null)
      return
    }

    const findTarget = () => {
      const element = document.querySelector(current.selector!)
      if (!element) {
        // Fallback position if element not found
        setSpotlight(null)
        setTooltipPos({ top: 200, left: 300 })
        return
      }

      const rect = element.getBoundingClientRect()
      const padding = 8

      setSpotlight({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      })

      // Calculate tooltip position
      const tooltipWidth = 340
      const tooltipHeight = 200
      const margin = 16

      let top = rect.top
      let left = rect.right + margin

      switch (current.position) {
        case 'left':
          left = rect.left - tooltipWidth - margin
          top = rect.top + (rect.height - tooltipHeight) / 2
          break
        case 'right':
          left = rect.right + margin
          top = rect.top + (rect.height - tooltipHeight) / 2
          break
        case 'top':
          left = rect.left + (rect.width - tooltipWidth) / 2
          top = rect.top - tooltipHeight - margin
          break
        case 'bottom':
          left = rect.left + (rect.width - tooltipWidth) / 2
          top = rect.bottom + margin
          break
        default:
          // Auto - try right first, then left
          if (rect.right + tooltipWidth + margin < window.innerWidth) {
            left = rect.right + margin
          } else {
            left = rect.left - tooltipWidth - margin
          }
      }

      // Keep within viewport
      top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin))
      left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin))

      setTooltipPos({ top, left })
    }

    findTarget()
    
    // Re-calculate on resize
    window.addEventListener('resize', findTarget)
    return () => window.removeEventListener('resize', findTarget)
  }, [current])

  if (!current) return null

  return (
    <>
      {/* SVG Mask Overlay */}
      <svg 
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1200,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* White = visible, Black = hidden */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        
        {/* Dark overlay with cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border glow */}
      {spotlight && (
        <div
          style={{
            position: 'fixed',
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: 12,
            border: '3px solid rgba(37, 99, 235, 0.8)',
            boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.3), 0 0 30px rgba(37, 99, 235, 0.4)',
            zIndex: 1201,
            pointerEvents: 'none',
            animation: 'spotlight-pulse 2s infinite',
          }}
        />
      )}

      {/* Click blocker (except spotlight area) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1199,
        }}
        onClick={onSkip}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: 340,
          backgroundColor: 'white',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          zIndex: 1202,
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        {/* Progress bar */}
        <div style={{ 
          height: 4, 
          backgroundColor: '#e5e7eb',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: COLORS.primary,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Step indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: COLORS.primary,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
            }}>
              {step + 1}
            </div>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>
              z {TOUR_STEPS.length}
            </span>
          </div>

          <h3 style={{ 
            margin: '0 0 8px', 
            fontSize: 18, 
            fontWeight: 600,
            color: COLORS.textPrimary,
          }}>
            {current.title}
          </h3>
          
          <p style={{ 
            margin: 0, 
            fontSize: 14, 
            color: COLORS.textSecondary,
            lineHeight: 1.6,
          }}>
            {current.desc}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
        }}>
          <button
            onClick={onSkip}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: COLORS.textMuted,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Přeskočit
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && onPrev && (
              <button
                onClick={onPrev}
                style={{
                  padding: '10px 16px',
                  border: `1px solid #e5e7eb`,
                  borderRadius: 8,
                  backgroundColor: 'white',
                  color: COLORS.textSecondary,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                ← Zpět
              </button>
            )}
            
            <button
              onClick={onNext}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: COLORS.primary,
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {isLast ? 'Dokončit ✓' : 'Další →'}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spotlight-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3), 0 0 30px rgba(37, 99, 235, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.2), 0 0 40px rgba(37, 99, 235, 0.5);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
