import { useEffect, useRef } from 'react'

/**
 * Focus Trap Hook
 * Traps focus within a container element (e.g., modal)
 * Pressing Tab cycles through focusable elements
 * Pressing Shift+Tab cycles backwards
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isActive: boolean = true) {
  const containerRef = useRef<T>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    const container = containerRef.current
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
        .filter(el => el.offsetParent !== null) // Filter out hidden elements
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Focus the first focusable element or the container itself
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    } else {
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}

/**
 * Modal wrapper component with focus trap
 */
export function FocusTrapWrapper({ 
  children, 
  isActive = true,
  className,
  style,
}: { 
  children: React.ReactNode
  isActive?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const containerRef = useFocusTrap<HTMLDivElement>(isActive)
  
  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  )
}
