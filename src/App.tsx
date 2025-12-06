/**
 * AdCreative Studio - Main App Entry
 * 
 * v3.0 - Přidány:
 * - ErrorBoundary pro graceful error handling
 * - ToastContainer pro notifikace
 * - Preload kritických komponent
 */

import React, { useEffect } from 'react'
import { AuthProvider } from '@/components/Auth'
import { StorageProvider } from '@/components/StorageProvider'
import { AppContent } from '@/AppContent'
import { ErrorBoundary, PageLoader } from '@/components/ErrorBoundary'
import { ToastContainer } from '@/components/ToastContainer'
import { preloadCriticalComponents } from '@/components/lazy'
import { debug } from '@/lib/debug'

export default function App() {
  // Preload důležité komponenty po načtení
  useEffect(() => {
    debug.info('App', 'Application mounted')
    preloadCriticalComponents()
  }, [])
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StorageProvider>
          <AppContent />
          <ToastContainer />
        </StorageProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
