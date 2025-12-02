/**
 * Mobile Bottom Navigation
 * 
 * Spodní navigace pro mobilní zařízení.
 * Zobrazuje se pouze na sm a menších breakpointech.
 */

import { useAppStore } from '@/stores/app-store'
import { useIsMobile } from '@/lib/mobile'
import { 
  Image, Grid3X3, Video, Plus, Settings, 
  Palette, Download, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onOpenSettings: () => void
  onOpenGenerator: () => void
}

export function MobileBottomNav({ onOpenSettings, onOpenGenerator }: Props) {
  const isMobile = useIsMobile()
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const creativesCount = useAppStore((s) => Object.keys(s.creatives).length)
  
  if (!isMobile) return null
  
  const navItems = [
    { 
      id: 'create' as const, 
      icon: <Plus className="w-5 h-5" />, 
      label: 'Vytvořit',
      primary: true,
    },
    { 
      id: 'gallery' as const, 
      icon: <Grid3X3 className="w-5 h-5" />, 
      label: 'Galerie',
      badge: creativesCount > 0 ? creativesCount : undefined,
    },
    { 
      id: 'video' as const, 
      icon: <Video className="w-5 h-5" />, 
      label: 'Video',
    },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full relative transition-colors",
              item.primary && activeView !== item.id 
                ? "text-blue-600 dark:text-blue-400"
                : activeView === item.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
            )}
          >
            {item.primary ? (
              <div className="w-12 h-12 -mt-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                {item.icon}
              </div>
            ) : (
              <>
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </>
            )}
          </button>
        ))}
        
        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 dark:text-gray-400"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs mt-1">Nastavení</span>
        </button>
      </div>
    </nav>
  )
}

// ============================================================================
// MOBILE ACTION BUTTON (FAB)
// ============================================================================

interface FABProps {
  onClick: () => void
  icon?: React.ReactNode
  label?: string
  position?: 'bottom-right' | 'bottom-center'
}

export function FloatingActionButton({ 
  onClick, 
  icon = <Plus className="w-6 h-6" />,
  label,
  position = 'bottom-right',
}: FABProps) {
  const isMobile = useIsMobile()
  
  if (!isMobile) return null
  
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-30 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center",
        "hover:bg-blue-700 active:scale-95 transition-all",
        positionClasses[position]
      )}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

// ============================================================================
// MOBILE HEADER
// ============================================================================

interface MobileHeaderProps {
  title: string
  subtitle?: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
}

export function MobileHeader({ title, subtitle, leftAction, rightAction }: MobileHeaderProps) {
  const isMobile = useIsMobile()
  
  if (!isMobile) return null
  
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-safe">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="w-10">
          {leftAction}
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// MOBILE SHEET (Bottom Sheet)
// ============================================================================

interface MobileSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  height?: 'auto' | 'half' | 'full'
}

export function MobileSheet({ isOpen, onClose, title, children, height = 'auto' }: MobileSheetProps) {
  if (!isOpen) return null
  
  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
  }
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl",
          "transform transition-transform duration-300 ease-out",
          heightClasses[height]
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        
        {/* Title */}
        {title && (
          <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto overscroll-contain pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MOBILE TABS
// ============================================================================

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface MobileTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export function MobileTabs({ tabs, activeTab, onChange }: MobileTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
            activeTab === tab.id
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// SWIPEABLE CARD
// ============================================================================

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: { icon: React.ReactNode; color: string; label: string }
  rightAction?: { icon: React.ReactNode; color: string; label: string }
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  leftAction,
  rightAction,
}: SwipeableCardProps) {
  // Simplified version - full implementation would need more state
  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left action background */}
      {leftAction && (
        <div className={`absolute inset-y-0 left-0 w-20 ${leftAction.color} flex items-center justify-center`}>
          {leftAction.icon}
        </div>
      )}
      
      {/* Right action background */}
      {rightAction && (
        <div className={`absolute inset-y-0 right-0 w-20 ${rightAction.color} flex items-center justify-center`}>
          {rightAction.icon}
        </div>
      )}
      
      {/* Content */}
      <div className="relative bg-white dark:bg-gray-800">
        {children}
      </div>
    </div>
  )
}

export default {
  MobileBottomNav,
  FloatingActionButton,
  MobileHeader,
  MobileSheet,
  MobileTabs,
  SwipeableCard,
}
