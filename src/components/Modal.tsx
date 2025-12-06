import { useEffect, useRef, ReactNode } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { COLORS } from '@/lib/design-tokens'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  subtitle?: string
  icon?: ReactNode
  width?: number | string
  maxHeight?: string
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  zIndex?: number
  className?: string
}

/**
 * Modal Component with Focus Trap
 * 
 * Features:
 * - Focus trap (Tab cycles through focusable elements)
 * - Escape key to close
 * - Click overlay to close (optional)
 * - Restores focus on close
 * - Prevents body scroll when open
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  width = 500,
  maxHeight = '90vh',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  zIndex = 1000,
  className,
}: ModalProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen)
  const previousOverflow = useRef<string>('')

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, closeOnEscape])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      previousOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = previousOverflow.current
    }

    return () => {
      document.body.style.overflow = previousOverflow.current
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
        animation: 'modalFadeIn 0.2s ease-out',
      }}
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={containerRef}
        className={className}
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 16,
          width: typeof width === 'number' ? `${width}px` : width,
          maxWidth: '95%',
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {icon && (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: COLORS.pageBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 600,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 14,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Zavřít"
                style={{
                  width: 36,
                  height: 36,
                  border: 'none',
                  borderRadius: 8,
                  backgroundColor: COLORS.pageBg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textSecondary,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.borderLight)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.pageBg)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Modal Footer component for action buttons
 */
export function ModalFooter({
  children,
  align = 'right',
}: {
  children: ReactNode
  align?: 'left' | 'center' | 'right' | 'between'
}) {
  const justifyMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    between: 'space-between',
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: justifyMap[align],
        alignItems: 'center',
        gap: 12,
        padding: '16px 24px',
        backgroundColor: COLORS.pageBg,
        borderTop: `1px solid ${COLORS.border}`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Modal Body component with padding
 */
export function ModalBody({
  children,
  padding = 24,
}: {
  children: ReactNode
  padding?: number | string
}) {
  return (
    <div style={{ padding: typeof padding === 'number' ? `${padding}px` : padding }}>
      {children}
    </div>
  )
}
