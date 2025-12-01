/**
 * AdCreative Studio - Main App Entry
 * 
 * Wraps the application in AuthProvider for authentication
 * Renders AppContent for logged-in users
 * Shows LandingPage for guests
 */

import React from 'react'
import { AuthProvider } from '@/components/Auth'
import { AppContent } from '@/AppContent'

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
