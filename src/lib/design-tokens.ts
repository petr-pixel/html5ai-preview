// ============================================================================
// DESIGN TOKENS - Centralized design system values
// ============================================================================

export const COLORS = {
  // Backgrounds
  pageBg: '#f3f4f6',
  cardBg: '#ffffff',
  sidebarBg: '#ffffff',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  
  // Primary
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  
  // Status
  success: '#22c55e',
  successLight: '#dcfce7',
  error: '#ef4444',
  warning: '#f59e0b',
  
  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
} as const

export const SIZES = {
  headerHeight: 56,
  footerHeight: 64,
  leftSidebar: 200,
  rightPanel: 400,
} as const

export type ColorKey = keyof typeof COLORS
export type SizeKey = keyof typeof SIZES
export type ViewType = 'editor' | 'gallery' | 'scoring' | 'copywriter' | 'branding' | 'video' | 'export' | 'admin'
