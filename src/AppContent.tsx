/**
 * AdCreative Studio v6 - Fixed Layout
 * 
 * - Fixed top bar
 * - Fixed left sidebar (steps)
 * - Scrollable main content
 * - Fixed right preview
 * - Fixed bottom bar
 * - Light theme
 */

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { platforms, getFormatKey } from '@/lib/platforms'
import { cn, loadImage, generateId } from '@/lib/utils'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { SettingsModal } from '@/components/SettingsModal'
import { GalleryView } from '@/components/GalleryView'
import type { PlatformId, Creative } from '@/types'
import {
  Check, ChevronDown, ChevronRight, Sparkles, 
  Image as ImageIcon, HelpCircle, MoreVertical, Plus, 
  Edit3, Smartphone, Monitor, X, ArrowLeft, ArrowRight,
  Wand2, Link, Globe, Lock, Images, Settings, Layers
} from 'lucide-react'

type ViewType = 'editor' | 'gallery'

// ============================================================================
// MAIN APP
// ============================================================================

export function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('editor')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { profile } = useAuth()
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {/* ===== FIXED TOP BAR ===== */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-800">AdCreative Studio</span>
        </div>
        
        <div className="h-6 w-px bg-gray-200 mx-4" />
        
        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setCurrentView('editor')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              currentView === 'editor'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            Generátor
          </button>
          <button
            onClick={() => setCurrentView('gallery')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              currentView === 'gallery'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            Galerie
          </button>
        </nav>
        
        <div className="flex-1" />
        
        {/* Right side */}
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <HelpCircle className="w-5 h-5 text-gray-500" />
        </button>
        <button onClick={() => setSettingsOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="h-6 w-px bg-gray-200 mx-3" />
        
        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">{profile?.name || 'User'}</div>
            <div className="text-xs text-gray-500">{profile?.email || 'email@example.com'}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>
      
      {/* ===== MAIN AREA (below top bar) ===== */}
      <div className="pt-14 pb-16 h-screen">
        {currentView === 'editor' ? (
          <EditorLayout />
        ) : (
          <div className="h-full overflow-auto p-6">
            <GalleryView />
          </div>
        )}
      </div>
      
      {/* ===== FIXED BOTTOM BAR ===== */}
      {currentView === 'editor' && (
        <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-end px-6 gap-3 z-50">
          <button 
            onClick={() => setCurrentView('gallery')}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm"
          >
            View Gallery
          </button>
          <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm">
            Export
          </button>
        </footer>
      )}
      
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

// ============================================================================
// EDITOR LAYOUT (3 columns)
// ============================================================================

function EditorLayout() {
  return (
    <div className="h-full flex">
      {/* Left Sidebar - Steps */}
      <LeftSidebar />
      
      {/* Main Content - Scrollable */}
      <MainContent />
      
      {/* Right Preview - Fixed */}
      <PreviewPanel />
    </div>
  )
}

// ============================================================================
// LEFT SIDEBAR (Steps)
// ============================================================================

function LeftSidebar() {
  const { creatives } = useAppStore()
  const creativesArray = Object.values(creatives)
  
  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-4 flex-shrink-0">
      <StepCircle step={1} done={creativesArray.length > 0} active />
      <StepCircle step={2} done={false} />
      <div className="flex-1" />
      <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
        <Lock className="w-5 h-5" />
      </button>
    </aside>
  )
}

function StepCircle({ step, done, active }: { step: number; done: boolean; active?: boolean }) {
  return (
    <div className={cn(
      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
      done 
        ? 'bg-green-500 text-white' 
        : active
          ? 'border-2 border-blue-600 text-blue-600 bg-white'
          : 'border-2 border-gray-300 text-gray-400 bg-white'
    )}>
      {done ? <Check className="w-5 h-5" /> : step}
    </div>
  )
}

// ============================================================================
// MAIN CONTENT (Scrollable)
// ============================================================================

function MainContent() {
  const {
    platform, category, setCategory,
    sourceImage, setSourceImage,
    selectedFormats, toggleFormat, selectAllFormats,
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
    <main className="flex-1 overflow-y-auto p-6" style={{ marginRight: '380px' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentPlatform && Object.entries(currentPlatform.categories).slice(0, 4).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                category === key
                  ? 'bg-white border-gray-300 text-gray-800 shadow-sm'
                  : 'bg-transparent border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
              )}
            >
              {cat.name}
            </button>
          ))}
          <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-full flex items-center gap-1 font-medium">
            <ChevronRight className="w-4 h-4" />
            View more
          </button>
        </div>
        
        {/* ===== IMAGES CARD ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center',
                creativesArray.length > 0 
                  ? 'bg-green-500 text-white' 
                  : 'border-2 border-gray-300'
              )}>
                {creativesArray.length > 0 && <Check className="w-4 h-4" />}
              </div>
              <span className="font-semibold text-gray-800">Images ({creativesArray.length}/20)</span>
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-full">
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Thumbnails */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              {/* Source image thumbnail */}
              {sourceImage && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={sourceImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Generated thumbnails */}
              {creativesArray.slice(0, 5).map((c) => (
                <div key={c.id} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {creativesArray.length > 5 && (
                <div className="w-12 h-12 rounded-lg bg-gray-800 text-white flex items-center justify-center text-xs font-medium">
                  +{creativesArray.length - 5}
                </div>
              )}
              {!sourceImage && (
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
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
                {sourceImage ? 'Change' : 'Upload'}
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
                className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {isGenerating ? `Generating ${progress}%` : 'Generate images'}
              </button>
            </div>
          </div>
          
          {/* Format Grid */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Recommended formats</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => selectAllFormats(formats.map((_, i) => getFormatKey(platform, category, i)))}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Select all
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* 4-column grid of format cards */}
            <div className="grid grid-cols-4 gap-3">
              {formats.slice(0, 8).map((format, index) => {
                const formatKey = getFormatKey(platform, category, index)
                const isSelected = selectedFormats.has(formatKey)
                const labels = ['From URL', 'Generated', 'Enhanced', 'Stock']
                const icons = [Link, Sparkles, Wand2, Globe]
                const LabelIcon = icons[index % 4]
                
                return (
                  <div 
                    key={formatKey} 
                    onClick={() => toggleFormat(formatKey)} 
                    className="cursor-pointer group"
                  >
                    <div className={cn(
                      'relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3]',
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300'
                    )}>
                      {/* Image */}
                      <div className="absolute inset-0 bg-gray-100">
                        {sourceImage ? (
                          <img src={sourceImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      
                      {/* Checkbox */}
                      <div className={cn(
                        'absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center transition-colors',
                        isSelected ? 'bg-blue-500' : 'bg-white border border-gray-300'
                      )}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      
                      {/* Size badge */}
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        {format.width}×{format.height}
                      </div>
                    </div>
                    
                    {/* Label */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                      <LabelIcon className="w-3.5 h-3.5" />
                      <span>{labels[index % 4]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* ===== LOGOS CARD ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <span className="font-semibold text-gray-800">Logos (4/5)</span>
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-full">
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-800">LOGO</div>
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-white text-xs font-bold">L</div>
              <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-[10px]">LOGO</div>
              <div className="w-10 h-10 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
        
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </main>
  )
}

// ============================================================================
// PREVIEW PANEL (Fixed right)
// ============================================================================

function PreviewPanel() {
  const { sourceImage, textOverlay } = useAppStore()
  const [activeChannel, setActiveChannel] = useState('display')
  
  const channels = [
    { id: 'youtube', label: 'YouTube', color: '#FF0000' },
    { id: 'gmail', label: 'Gmail', color: '#EA4335' },
    { id: 'search', label: 'Search', color: '#4285F4' },
    { id: 'display', label: 'Display', color: '#4285F4' },
    { id: 'discover', label: 'Discover', color: '#FF5722' },
    { id: 'maps', label: 'Maps', color: '#34A853' },
  ]
  
  return (
    <aside className="w-[380px] bg-white border-l border-gray-200 flex flex-col fixed right-0 top-14 bottom-16 overflow-hidden">
      {/* Ad Strength */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#22c55e" strokeWidth="3" 
                      strokeDasharray="100" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-600">Ad Strength</div>
            <div className="text-sm font-semibold text-green-600">Excellent</div>
          </div>
        </div>
      </div>
      
      {/* Preview Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-700">Preview</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
              <Smartphone className="w-4 h-4" />
            </button>
            <button className="p-1.5 bg-gray-100 rounded text-gray-600">
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Channel Tabs */}
        <div className="flex gap-1">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg transition-colors',
                activeChannel === ch.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Phone Mockup */}
      <div className="flex-1 p-6 bg-gray-50 flex items-start justify-center overflow-y-auto">
        <div className="w-[220px] bg-white rounded-[28px] shadow-xl border border-gray-200 overflow-hidden">
          {/* Notch */}
          <div className="h-6 bg-white flex items-center justify-center">
            <div className="w-16 h-1 bg-gray-200 rounded-full" />
          </div>
          
          {/* Screen */}
          <div className="relative">
            {sourceImage ? (
              <img src={sourceImage} alt="Preview" className="w-full aspect-[3/4] object-cover" />
            ) : (
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-60" />
                  <p className="text-xs opacity-75">Upload image</p>
                </div>
              </div>
            )}
            
            {/* Text Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12">
              <div className="text-white text-[10px] font-bold mb-1 opacity-80">BRAND</div>
              <h3 className="text-white font-bold text-sm leading-tight mb-1">
                {textOverlay.headline || 'Your headline here'}
              </h3>
              <p className="text-white/80 text-[10px] leading-tight">
                {textOverlay.subheadline || 'Your description text goes here'}
              </p>
            </div>
            
            {/* Close button */}
            <button className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
          
          {/* Ad indicator */}
          <div className="py-2 bg-white flex items-center justify-center border-t border-gray-100">
            <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
              Ad <ChevronDown className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default AppContent
