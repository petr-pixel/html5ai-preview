/**
 * Lazy Loading Setup
 * 
 * Definuje lazy-loaded komponenty pro rychlejší initial load.
 * 
 * POUŽITÍ:
 * import { LazyGalleryView, LazyVideoEditor } from '@/components/lazy'
 * 
 * <Suspense fallback={<LoadingSpinner />}>
 *   <LazyGalleryView />
 * </Suspense>
 */

import { lazy } from 'react'
import { lazyWithRetry } from './ErrorBoundary'

// ============================================================================
// HEAVY COMPONENTS - lazy load
// ============================================================================

// Gallery - velká komponenta s mnoha kreativami
export const LazyGalleryView = lazyWithRetry(() => import('./GalleryView'))

// Video editor - komplexní, nepotřebuje se hned
export const LazyVideoScenarioEditor = lazyWithRetry(() => import('./VideoScenarioEditor'))

// Slideshow builder - těžká komponenta
export const LazySlideshowBuilder = lazyWithRetry(() => import('./SlideshowBuilder'))

// Template library - hodně dat
export const LazyTemplateLibrary = lazyWithRetry(() => import('./TemplateLibrary'))

// Admin dashboard - jen pro adminy
export const LazyAdminDashboard = lazyWithRetry(() => import('./AdminDashboard'))

// AI Branding Kit - komplexní
export const LazyAIBrandingKit = lazyWithRetry(() => import('./AIBrandingKit'))

// AI Copywriter - nepotřebuje se vždy
export const LazyAICopywriter = lazyWithRetry(() => import('./AICopywriter'))

// Creative Scoring - analýza
export const LazyCreativeScoring = lazyWithRetry(() => import('./CreativeScoring'))

// Bulk Edit Mode - pokročilá funkce
export const LazyBulkEditMode = lazyWithRetry(() => import('./BulkEditMode'))

// ============================================================================
// MEDIUM COMPONENTS - optional lazy
// ============================================================================

// Format Editor V2 - důležitá, ale může být lazy
export const LazyFormatEditorV2 = lazyWithRetry(() => import('./FormatEditorV2'))

// Format Editor V3 - plně vybavený profesionální editor
export const LazyFormatEditorV3 = lazyWithRetry(() => import('./FormatEditorV3'))

// Magic Resize - pokročilá funkce
export const LazyMagicResize = lazyWithRetry(() => import('./MagicResize'))

// Mobile Preview - volitelná
export const LazyMobilePreview = lazyWithRetry(() => import('./MobilePreview'))

// ============================================================================
// PRELOAD FUNCTIONS
// ============================================================================

/**
 * Preload komponenty když uživatel hover nad tlačítkem
 */
export function preloadGallery() {
  import('./GalleryView')
}

export function preloadVideoEditor() {
  import('./VideoScenarioEditor')
}

export function preloadBrandingKit() {
  import('./AIBrandingKit')
}

export function preloadCopywriter() {
  import('./AICopywriter')
}

/**
 * Preload všechny důležité komponenty po initial load
 */
export function preloadCriticalComponents() {
  // Počkej na idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('./GalleryView')
      import('./FormatEditorV3')
    })
  } else {
    setTimeout(() => {
      import('./GalleryView')
      import('./FormatEditorV3')
    }, 2000)
  }
}

// ============================================================================
// VIRTUALIZED LIST HELPERS
// ============================================================================

/**
 * Chunk array pro virtualizaci
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Intersection Observer hook pro lazy loading
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry)
        }
      })
    },
    {
      rootMargin: '100px',
      threshold: 0.1,
      ...options,
    }
  )
}

export default {
  LazyGalleryView,
  LazyVideoScenarioEditor,
  LazySlideshowBuilder,
  LazyTemplateLibrary,
  LazyAdminDashboard,
  LazyAIBrandingKit,
  LazyAICopywriter,
  LazyCreativeScoring,
  LazyBulkEditMode,
  LazyFormatEditorV2,
  LazyFormatEditorV3,
  LazyMagicResize,
  LazyMobilePreview,
  preloadGallery,
  preloadVideoEditor,
  preloadBrandingKit,
  preloadCopywriter,
  preloadCriticalComponents,
}
