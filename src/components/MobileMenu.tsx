/**
 * Mobile Menu - Hamburger menu pro mobilní zařízení
 */

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function MobileMenuButton({ 
  isOpen, 
  onToggle 
}: { 
  isOpen: boolean
  onToggle: () => void 
}) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-white/10 text-white shadow-lg"
      aria-label={isOpen ? 'Zavřít menu' : 'Otevřít menu'}
    >
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  )
}

export function MobileMenuOverlay({
  isOpen,
  onClose,
  children,
}: MobileMenuProps) {
  // Zavřít při Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {children}
      </div>
    </>
  )
}

// Hook pro mobile detection
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  
  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)
  
  // Auto-close when resizing to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false)
    }
  }, [isMobile, isOpen])
  
  return { isOpen, toggle, close, open, isMobile }
}

export default MobileMenuOverlay
