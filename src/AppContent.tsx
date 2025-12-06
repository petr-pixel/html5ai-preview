/**
 * AdCreative Studio - Google Ads Style
 * 
 * Světlý, profesionální design inspirovaný Google Ads
 * Desktop only
 */

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { useStorageSync } from '@/hooks/useStorageSync'
import { platforms, getFormatKey } from '@/lib/platforms'
import { cn, loadImage, generateId } from '@/lib/utils'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { SettingsModal } from '@/components/SettingsModal'
import { GalleryView } from '@/components/GalleryView'
import { CreativeScoring } from '@/components/CreativeScoring'
import { AICopywriter } from '@/components/AICopywriter'
import { AIBrandingKit } from '@/components/AIBrandingKit'
import { MagicResize } from '@/components/MagicResize'
import { SlideshowBuilder } from '@/components/SlideshowBuilder'
import { BulkEditMode } from '@/components/BulkEditMode'
import { AdminDashboard } from '@/components/AdminDashboard'
import type { PlatformId, Creative, Format } from '@/types'
import {
  Check, ChevronDown, ChevronRight, Upload, Sparkles, 
  Image as ImageIcon, HelpCircle, MoreVertical, Plus, 
  Edit3, Smartphone, Monitor, X, ArrowLeft, ArrowRight,
  Wand2, Link, Globe, Lock, Images, Brain, Video, 
  Download, Settings, Shield, LayoutDashboard
} from 'lucide-react'

// View types
type ViewType = 'editor' | 'gallery' | 'scoring' | 'copywriter' | 'branding' | 'resize' | 'video' | 'export' | 'admin'

// ============================================================================
// ICONS
// ============================================================================

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#4285F4" d="M22 6v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2z"/>
    <path fill="#EA4335" d="M22 6l-10 7L2 6"/>
    <path fill="#FBBC05" d="M2 6v12l6-6"/>
    <path fill="#34A853" d="M22 6v12l-6-6"/>
    <path fill="#C5221F" d="M22 6l-10 7L2 6h20z"/>
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#4285F4">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

const DisplayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#4285F4">
    <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
  </svg>
)

const DiscoverIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#FF5722" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <path fill="#FF5722" d="M6.5 17.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
  </svg>
)

const MapsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#34A853">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)

// ============================================================================
// MAIN APP
// ============================================================================

export function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('editor')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { profile } = useAuth()
  const isAdmin = profile?.is_admin === true
  
  // Sync storage
  useStorageSync()
  
  // Navigation items
  const navItems = [
    { id: 'editor' as ViewType, icon: <Wand2 className="w-4 h-4" />, label: 'Generátor' },
    { id: 'gallery' as ViewType, icon: <Images className="w-4 h-4" />, label: 'Galerie' },
    { id: 'scoring' as ViewType, icon: <Sparkles className="w-4 h-4" />, label: 'Scoring' },
    { id: 'copywriter' as ViewType, icon: <Brain className="w-4 h-4" />, label: 'Copywriter' },
    { id: 'branding' as ViewType, icon: <LayoutDashboard className="w-4 h-4" />, label: 'Brand Kit' },
    { id: 'video' as ViewType, icon: <Video className="w-4 h-4" />, label: 'Video' },
    { id: 'export' as ViewType, icon: <Download className="w-4 h-4" />, label: 'Export' },
  ]
  
  // Render current view content
  const renderContent = () => {
    switch (currentView) {
      case 'editor':
        return <EditorView />
      case 'gallery':
        return (
          <div className="flex-1 overflow-hidden bg-white">
            <GalleryView />
          </div>
        )
      case 'scoring':
        return (
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto">
              <CreativeScoring />
            </div>
          </div>
        )
      case 'copywriter':
        return (
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto">
              <AICopywriter />
            </div>
          </div>
        )
      case 'branding':
        return (
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto">
              <AIBrandingKit />
            </div>
          </div>
        )
      case 'video':
        return (
          <div className="flex-1 overflow-hidden bg-[#f8f9fa]">
            <SlideshowBuilder />
          </div>
        )
      case 'export':
        return (
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto">
              <BulkEditMode />
            </div>
          </div>
        )
      case 'admin':
        return (
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
            <div className="max-w-6xl mx-auto">
              <AdminDashboard />
            </div>
          </div>
        )
      default:
        return <EditorView />
    }
  }
  
  return (
    <div className="h-screen bg-[#f8f9fa] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-2">
          <GoogleLogo />
          <span className="text-xl text-gray-600 font-normal">Ads</span>
        </div>
        
        <div className="h-6 w-px bg-gray-300 mx-2" />
        
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                currentView === item.id
                  ? 'bg-[#e8f0fe] text-[#1a73e8]'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                currentView === 'admin'
                  ? 'bg-[#e8f0fe] text-[#1a73e8]'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}
        </nav>
        
        <div className="flex-1" />
        
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <HelpCircle className="w-5 h-5 text-gray-500" />
        </button>
        
        <button onClick={() => setSettingsOpen(true)} className="p-2 hover:bg-gray-100 rounded-full">
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-2">
          <div className="text-right">
            <div className="text-sm text-gray-700">{profile?.name || 'User'}</div>
            <div className="text-xs text-gray-500">{profile?.email || 'email@example.com'}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium text-sm">
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {renderContent()}
      </div>
      
      {/* Bottom Bar - jen pro editor */}
      {currentView === 'editor' && (
        <footer className="h-16 bg-white border-t border-gray-200 flex items-center justify-end px-6 gap-3 flex-shrink-0">
          <button 
            onClick={() => setCurrentView('gallery')}
            className="px-4 py-2 text-[#1a73e8] hover:bg-blue-50 rounded font-medium text-sm"
          >
            View Gallery
          </button>
          <button className="px-5 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 text-sm">
            Back
          </button>
          <button 
            onClick={() => setCurrentView('export')}
            className="px-5 py-2 bg-[#1a73e8] text-white rounded font-medium hover:bg-[#1557b0] text-sm"
          >
            Export
          </button>
        </footer>
      )}
      
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

// ============================================================================
// EDITOR VIEW
// ============================================================================

function EditorView() {
  const {
    platform, category, setPlatform, setCategory,
    sourceImage, setSourceImage,
    selectedFormats, toggleFormat, selectAllFormats,
    textOverlay, setTextOverlay,
    creatives, addCreatives,
    isGenerating, setIsGenerating, progress, setProgress,
  } = useAppStore()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform?.categories[category]
  const formats = currentCategory?.formats || []
  const creativesArray = Object.values(creatives)
  
  // Handle file upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setSourceImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }
  
  // Generate creatives
  const handleGenerate = async () => {
    if (!sourceImage || selectedFormats.size === 0) return
    
    setIsGenerating(true)
    setProgress(0)
    
    try {
      const img = await loadImage(sourceImage)
      const formatKeys = Array.from(selectedFormats)
      const newCreatives: Creative[] = []
      
      for (let i = 0; i < formatKeys.length; i++) {
        const formatKey = formatKeys[i]
        const [plat, cat, idx] = formatKey.split('_')
        const fmt = platforms[plat as PlatformId]?.categories[cat]?.formats[parseInt(idx)]
        if (!fmt) continue
        
        setProgress(Math.round(((i + 0.5) / formatKeys.length) * 100))
        
        const canvas = document.createElement('canvas')
        canvas.width = fmt.width
        canvas.height = fmt.height
        const ctx = canvas.getContext('2d')!
        
        const crop = await calculateSmartCrop(sourceImage, fmt.width, fmt.height)
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, fmt.width, fmt.height)
        
        if (textOverlay.enabled && textOverlay.headline) {
          const fontSize = Math.min(fmt.width, fmt.height) * 0.08
          ctx.font = `bold ${fontSize}px Arial`
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
          ctx.shadowBlur = 4
          ctx.fillText(textOverlay.headline, 20, fmt.height - 40)
        }
        
        newCreatives.push({
          id: generateId(),
          formatKey,
          platform: plat as PlatformId,
          category: cat,
          format: fmt,
          imageUrl: canvas.toDataURL('image/png'),
          createdAt: new Date(),
          sizeKB: 0,
        })
        
        setProgress(Math.round(((i + 1) / formatKeys.length) * 100))
      }
      
      addCreatives(newCreatives)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <>
      {/* Left Steps Sidebar */}
      <aside className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-3 flex-shrink-0">
        <StepIndicator step={1} done={creativesArray.length >= 1} active />
        <StepIndicator step={2} done={false} />
        <div className="flex-1" />
        <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
          <Lock className="w-5 h-5" />
        </button>
      </aside>
      
      {/* Main Panel */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[720px] mx-auto space-y-6">
          {/* Category Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentPlatform && Object.entries(currentPlatform.categories).slice(0, 3).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm border transition-colors',
                  category === key
                    ? 'bg-white border-gray-300 text-gray-700 shadow-sm'
                    : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {cat.name}
              </button>
            ))}
            <button className="px-4 py-2 text-sm text-[#1a73e8] hover:bg-blue-50 rounded-full flex items-center gap-1 font-medium">
              <ArrowRight className="w-4 h-4" />
              View more
            </button>
          </div>
          
          {/* Images Section */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center',
                  creativesArray.length >= 1 
                    ? 'bg-[#1e8e3e] text-white' 
                    : 'border-2 border-gray-300'
                )}>
                  {creativesArray.length >= 1 && <Check className="w-4 h-4" />}
                </div>
                <span className="font-medium text-gray-800">
                  Images ({creativesArray.length}/20)
                </span>
              </div>
              <button className="p-1.5 hover:bg-gray-100 rounded-full">
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Thumbnails Row */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                {creativesArray.slice(0, 6).map((c: any, i) => (
                  <div key={c.id} className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {creativesArray.length > 6 && (
                  <div className="w-11 h-11 rounded-lg bg-gray-700 text-white flex items-center justify-center text-xs font-medium">
                    +{creativesArray.length - 6}
                  </div>
                )}
                {creativesArray.length === 0 && sourceImage && (
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={sourceImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
                  className="px-4 py-2 border border-blue-200 bg-[#e8f0fe] rounded-lg text-sm font-medium text-[#1a73e8] hover:bg-[#d2e3fc] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  {isGenerating ? `Generating ${progress}%` : 'Generate images'}
                </button>
              </div>
            </div>
            
            {/* Recommended Section */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">Recommended</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => selectAllFormats(formats.map((_, i) => getFormatKey(platform, category, i)))}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Select all
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded">
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Format Cards Grid */}
              <div className="grid grid-cols-4 gap-4">
                {formats.slice(0, 4).map((format, index) => {
                  const formatKey = getFormatKey(platform, category, index)
                  const isSelected = selectedFormats.has(formatKey)
                  const labels = [
                    { icon: <Link className="w-3.5 h-3.5" />, text: 'From your URL' },
                    { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Generated' },
                    { icon: <Wand2 className="w-3.5 h-3.5" />, text: 'Enhanced from URL' },
                    { icon: <Globe className="w-3.5 h-3.5" />, text: 'Free stock image' },
                  ]
                  const label = labels[index % 4]
                  
                  return (
                    <div key={formatKey} onClick={() => toggleFormat(formatKey)} className="cursor-pointer group">
                      <div className={cn(
                        'relative rounded-xl overflow-hidden border-2 transition-all',
                        isSelected ? 'border-[#1a73e8] ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                      )}>
                        <div className="aspect-[4/3] bg-gray-100">
                          {sourceImage ? (
                            <img src={sourceImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-10 h-10 text-gray-300" />
                            </div>
                          )}
                        </div>
                        
                        {/* Checkbox */}
                        <div className={cn(
                          'absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center transition-colors',
                          isSelected ? 'bg-[#1a73e8]' : 'bg-white border border-gray-300'
                        )}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        
                        {/* Arrow */}
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      
                      {/* Label */}
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                        {label.icon}
                        <span>{label.text}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
          
          {/* Logos Section */}
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#1e8e3e] flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#1e8e3e]" />
                </div>
                <span className="font-medium text-gray-800">Logos (4/5)</span>
              </div>
              <button className="p-1.5 hover:bg-gray-100 rounded-full">
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-800">SOSA</div>
                <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-white text-xs font-bold">S</div>
                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-[10px]">SOSA</div>
                <div className="w-9 h-9 rounded-lg border border-dashed border-gray-300" />
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </section>
        </div>
      </main>
      
      {/* Right Preview Panel */}
      <PreviewPanel sourceImage={sourceImage} textOverlay={textOverlay} />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </>
  )
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

function StepIndicator({ step, done, active }: { step: number; done: boolean; active?: boolean }) {
  return (
    <div className={cn(
      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
      done 
        ? 'bg-[#1e8e3e] text-white' 
        : active
          ? 'border-2 border-[#1a73e8] text-[#1a73e8]'
          : 'border-2 border-gray-300 text-gray-400'
    )}>
      {done ? <Check className="w-5 h-5" /> : step}
    </div>
  )
}

// ============================================================================
// PREVIEW PANEL
// ============================================================================

function PreviewPanel({ sourceImage, textOverlay }: { sourceImage: string | null; textOverlay: any }) {
  const [activeChannel, setActiveChannel] = useState('display')
  
  const channels = [
    { id: 'youtube', icon: <YouTubeIcon />, label: 'YouTube' },
    { id: 'gmail', icon: <GmailIcon />, label: 'Gmail' },
    { id: 'search', icon: <SearchIcon />, label: 'Search' },
    { id: 'display', icon: <DisplayIcon />, label: 'Display' },
    { id: 'discover', icon: <DiscoverIcon />, label: 'Discover' },
    { id: 'maps', icon: <MapsIcon />, label: 'Maps' },
  ]
  
  return (
    <aside className="w-[380px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
      {/* Ad Strength */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Circular progress */}
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90">
                <circle cx="16" cy="16" r="14" fill="none" stroke="#e8eaed" strokeWidth="3" />
                <circle cx="16" cy="16" r="14" fill="none" stroke="#1e8e3e" strokeWidth="3" 
                        strokeDasharray="88" strokeDashoffset="0" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">
              Ad Strength: <span className="text-[#1e8e3e] font-medium">Excellent</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-gray-100 rounded">
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Preview</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
              <Smartphone className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600 bg-gray-100">
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Channel Tabs */}
        <div className="flex justify-between">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className="flex flex-col items-center gap-1 px-1"
            >
              <div className={cn(
                'transition-opacity',
                activeChannel === channel.id ? 'opacity-100' : 'opacity-50'
              )}>
                {channel.icon}
              </div>
              <span className={cn(
                'text-xs',
                activeChannel === channel.id ? 'text-[#1a73e8] font-medium' : 'text-gray-500'
              )}>
                {channel.label}
              </span>
              {activeChannel === channel.id && (
                <div className="w-full h-[3px] bg-[#1a73e8] rounded-full mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Phone Preview */}
      <div className="flex-1 p-6 flex items-start justify-center bg-[#f8f9fa] overflow-y-auto">
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-[240px] bg-white rounded-[32px] shadow-xl border border-gray-200 overflow-hidden">
            {/* Notch */}
            <div className="h-7 bg-white flex items-center justify-center relative">
              <div className="absolute left-1/2 -translate-x-1/2 w-20 h-[5px] bg-gray-200 rounded-full" />
              <div className="absolute right-3 w-2 h-2 rounded-full bg-gray-200" />
            </div>
            
            {/* Ad Content */}
            <div className="relative">
              {sourceImage ? (
                <img src={sourceImage} alt="Preview" className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <div className="text-center text-white">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Upload an image</p>
                  </div>
                </div>
              )}
              
              {/* Close button */}
              <button className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
              
              {/* Logo */}
              <div className="absolute top-3 left-3 text-white font-bold text-lg drop-shadow-lg">
                SOSA
              </div>
              
              {/* Text Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
                <h3 className="text-white font-black text-xl leading-tight uppercase tracking-tight">
                  {textOverlay.headline || 'NEVER SHOP FOR CAT FOOD AGAIN'}
                </h3>
                <p className="text-white/90 text-xs mt-2 leading-relaxed">
                  {textOverlay.subheadline || 'Packed with everything your cat needs for a healthy, happy life. Delivered monthly from $29'}
                </p>
              </div>
            </div>
            
            {/* Ad indicator */}
            <div className="py-2 bg-white flex items-center justify-center border-t border-gray-100">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                Ad <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default AppContent
