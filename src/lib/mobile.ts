/**
 * Mobile & Responsive Utilities
 * 
 * Hooks a utility funkce pro responsivní design a mobile UX.
 * 
 * POUŽITÍ:
 * import { useIsMobile, useBreakpoint, useSwipeGesture } from '@/lib/mobile'
 * 
 * const isMobile = useIsMobile()
 * const breakpoint = useBreakpoint() // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * useSwipeGesture(ref, { onSwipeLeft: () => next() })
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// BREAKPOINTS (Tailwind defaults)
// ============================================================================

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

// ============================================================================
// useIsMobile
// ============================================================================

/**
 * Vrací true pokud je viewport menší než 768px
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.md)
    
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  
  return isMobile
}

// ============================================================================
// useBreakpoint
// ============================================================================

/**
 * Vrací aktuální breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md')
  
  useEffect(() => {
    const check = () => {
      const width = window.innerWidth
      
      if (width >= BREAKPOINTS['2xl']) setBreakpoint('2xl')
      else if (width >= BREAKPOINTS.xl) setBreakpoint('xl')
      else if (width >= BREAKPOINTS.lg) setBreakpoint('lg')
      else if (width >= BREAKPOINTS.md) setBreakpoint('md')
      else if (width >= BREAKPOINTS.sm) setBreakpoint('sm')
      else setBreakpoint('xs')
    }
    
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  
  return breakpoint
}

// ============================================================================
// useMediaQuery
// ============================================================================

/**
 * Sleduje media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])
  
  return matches
}

// ============================================================================
// useSwipeGesture
// ============================================================================

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // min distance for swipe (default 50px)
}

/**
 * Detekuje swipe gesta na touch zařízeních
 */
export function useSwipeGesture<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handlers: SwipeHandlers
) {
  const threshold = handlers.threshold || 50
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return
      
      const deltaX = e.changedTouches[0].clientX - touchStart.current.x
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y
      
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      // Horizontal swipe
      if (absX > absY && absX > threshold) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.()
        } else {
          handlers.onSwipeLeft?.()
        }
      }
      
      // Vertical swipe
      if (absY > absX && absY > threshold) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.()
        } else {
          handlers.onSwipeUp?.()
        }
      }
      
      touchStart.current = null
    }
    
    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref, handlers, threshold])
}

// ============================================================================
// useLongPress
// ============================================================================

interface LongPressOptions {
  duration?: number // ms, default 500
  onLongPress: () => void
  onClick?: () => void
}

/**
 * Detekuje long press na touch zařízeních
 */
export function useLongPress(options: LongPressOptions) {
  const { duration = 500, onLongPress, onClick } = options
  const timerRef = useRef<number>()
  const isLongPress = useRef(false)
  
  const start = useCallback(() => {
    isLongPress.current = false
    timerRef.current = window.setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, duration)
  }, [duration, onLongPress])
  
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])
  
  const handleClick = useCallback(() => {
    if (!isLongPress.current) {
      onClick?.()
    }
  }, [onClick])
  
  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
  }
}

// ============================================================================
// useViewportSize
// ============================================================================

interface ViewportSize {
  width: number
  height: number
  isLandscape: boolean
  isPortrait: boolean
}

/**
 * Sleduje velikost viewportu
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isLandscape: true,
    isPortrait: false,
  })
  
  useEffect(() => {
    const update = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setSize({
        width,
        height,
        isLandscape: width > height,
        isPortrait: height > width,
      })
    }
    
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  
  return size
}

// ============================================================================
// useSafeArea
// ============================================================================

interface SafeArea {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Vrací safe area insets pro notched devices (iPhone X+)
 */
export function useSafeArea(): SafeArea {
  const [safeArea, setSafeArea] = useState<SafeArea>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })
  
  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement)
      setSafeArea({
        top: parseInt(style.getPropertyValue('--sat') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      })
    }
    
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  
  return safeArea
}

// ============================================================================
// usePreventScroll
// ============================================================================

/**
 * Zabraňuje scrollování body (pro modaly)
 */
export function usePreventScroll(prevent: boolean) {
  useEffect(() => {
    if (!prevent) return
    
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [prevent])
}

// ============================================================================
// useOnClickOutside
// ============================================================================

/**
 * Detekuje klik mimo element
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }
    
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

// ============================================================================
// RESPONSIVE CLASS HELPERS
// ============================================================================

/**
 * Generuje responsive třídy
 */
export function responsive(base: string, overrides?: Partial<Record<Breakpoint, string>>): string {
  if (!overrides) return base
  
  const classes = [base]
  
  if (overrides.sm) classes.push(`sm:${overrides.sm}`)
  if (overrides.md) classes.push(`md:${overrides.md}`)
  if (overrides.lg) classes.push(`lg:${overrides.lg}`)
  if (overrides.xl) classes.push(`xl:${overrides.xl}`)
  if (overrides['2xl']) classes.push(`2xl:${overrides['2xl']}`)
  
  return classes.join(' ')
}

/**
 * Skryje element na určitých breakpointech
 */
export function hideOn(breakpoints: Breakpoint[]): string {
  return breakpoints.map(bp => {
    if (bp === 'xs') return 'hidden sm:block'
    return `${bp}:hidden`
  }).join(' ')
}

/**
 * Zobrazí element pouze na určitých breakpointech
 */
export function showOn(breakpoints: Breakpoint[]): string {
  const hidden = 'hidden'
  const show = breakpoints.map(bp => `${bp}:block`).join(' ')
  return `${hidden} ${show}`
}

// ============================================================================
// TOUCH DETECTION
// ============================================================================

/**
 * Detekuje touch zařízení
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Hook pro detekci touch zařízení
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)
  
  useEffect(() => {
    setIsTouch(isTouchDevice())
  }, [])
  
  return isTouch
}

// ============================================================================
// PULL TO REFRESH (placeholder)
// ============================================================================

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
}

/**
 * Pull to refresh gesture
 */
export function usePullToRefresh(options: PullToRefreshOptions) {
  const { onRefresh, threshold = 80 } = options
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const startY = useRef(0)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY.current)
    setPullDistance(Math.min(distance, threshold * 1.5))
  }, [isPulling, threshold])
  
  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
    
    setIsPulling(false)
    setPullDistance(0)
  }, [pullDistance, threshold, isRefreshing, onRefresh])
  
  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1),
  }
}

export default {
  useIsMobile,
  useBreakpoint,
  useMediaQuery,
  useSwipeGesture,
  useLongPress,
  useViewportSize,
  useSafeArea,
  usePreventScroll,
  useOnClickOutside,
  useIsTouchDevice,
  usePullToRefresh,
  responsive,
  hideOn,
  showOn,
  isTouchDevice,
  BREAKPOINTS,
}
