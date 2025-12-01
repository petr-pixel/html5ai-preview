/**
 * AdCreative Studio - Main App Entry
 * 
 * Wraps the application in AuthProvider for authentication
 * and StorageProvider for data persistence
 * Renders AppContent for logged-in users
 * Shows LandingPage for guests
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
