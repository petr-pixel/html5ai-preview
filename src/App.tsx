/**
 * AdCreative Studio - Main App Entry
 */

import React from 'react'
import { AuthProvider } from '@/components/Auth'
import { StorageProvider } from '@/components/StorageProvider'
import { AppContent } from '@/AppContent'

export default function App() {
  return (
    <AuthProvider>
      <StorageProvider>
        <AppContent />
      </StorageProvider>
    </AuthProvider>
  )
}
