/**
 * MobilePreview - Simulace zobrazení na různých zařízeních
 * 
 * Funkce:
 * - Přepínání mezi zařízeními (iPhone, Android, tablet)
 * - Simulace Sklik/Google Ads placement
 * - Dark mode preview
 * - Screenshot funkcionalita
 */

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import type { Creative } from '@/types'

// =============================================================================
// ICONS
// =============================================================================

const SmartphoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const TabletIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const DesktopIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// =============================================================================
// TYPES
// =============================================================================

interface Device {
  id: string
  name: string
  width: number
  height: number
  icon: React.ElementType
  scale?: number
}

interface MobilePreviewProps {
  creative?: Creative
  onClose?: () => void
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEVICES: Device[] = [
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, icon: SmartphoneIcon, scale: 0.6 },
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, icon: SmartphoneIcon, scale: 0.65 },
  { id: 'pixel-7', name: 'Pixel 7', width: 412, height: 915, icon: SmartphoneIcon, scale: 0.55 },
  { id: 'ipad', name: 'iPad', width: 768, height: 1024, icon: TabletIcon, scale: 0.5 },
  { id: 'ipad-pro', name: 'iPad Pro', width: 1024, height: 1366, icon: TabletIcon, scale: 0.4 },
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900, icon: DesktopIcon, scale: 0.5 },
]

const PLACEMENTS = [
  { id: 'feed', name: 'Feed', description: 'Sociální sítě, novinky' },
  { id: 'sidebar', name: 'Sidebar', description: 'Boční panel webů' },
  { id: 'interstitial', name: 'Interstitial', description: 'Celostránková reklama' },
  { id: 'native', name: 'Native', description: 'Nativní v obsahu' },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MobilePreview({ creative: propCreative, onClose }: MobilePreviewProps) {
  const { creatives } = useAppStore()
  
  // Použít předanou creative nebo první ze store
  const creative = propCreative ?? creatives[0]
  
  const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0])
  const [placement, setPlacement] = useState('feed')
  const [darkMode, setDarkMode] = useState(false)
  const [selectedCreativeIndex, setSelectedCreativeIndex] = useState(0)
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Pokud není předaná creative, použít vybranou z galerie
  const displayedCreative = propCreative ?? creatives[selectedCreativeIndex]
  
  const takeScreenshot = async () => {
    if (!previewRef.current) return
    
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(previewRef.current)
      const link = document.createElement('a')
      link.download = `preview-${selectedDevice.id}-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Screenshot failed:', error)
      alert('Screenshot se nepodařil. Zkuste to znovu.')
    }
  }
  
  // Empty state když není žádná creative
  if (!displayedCreative) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <SmartphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Žádné kreativy</h3>
          <p className="text-gray-500">Nejprve vygenerujte nějaké kreativy v editoru</p>
        </div>
      </div>
    )
  }

  return (
    <div className={onClose ? "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" : "flex-1 p-4"}>
      <div className={`bg-white rounded-xl shadow-2xl ${onClose ? 'max-w-5xl w-full max-h-[95vh]' : 'w-full h-full'} overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <SmartphoneIcon className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Náhled na zařízení</h3>
              <p className="text-sm text-gray-500">{displayedCreative.format?.name || 'Creative'} • {displayedCreative.format?.width || '?'}×{displayedCreative.format?.height || '?'}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        
        {/* Creative selector when standalone */}
        {!propCreative && creatives.length > 1 && (
          <div className="px-6 py-2 border-b bg-gray-50 flex items-center gap-2 overflow-x-auto">
            <span className="text-sm text-gray-500 flex-shrink-0">Vybrat:</span>
            {creatives.slice(0, 10).map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedCreativeIndex(i)}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 ${
                  i === selectedCreativeIndex ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        
        {/* Toolbar */}
        <div className="px-6 py-3 border-b flex items-center gap-4 flex-wrap flex-shrink-0">
          {/* Device selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {DEVICES.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device)}
                className={cn(
                  "px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors",
                  selectedDevice.id === device.id
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <device.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{device.name}</span>
              </button>
            ))}
          </div>
          
          {/* Placement selector */}
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            {PLACEMENTS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              darkMode ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-gray-600"
            )}
          >
            {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          
          <div className="flex-1" />
          
          {/* Screenshot button */}
          <button
            onClick={takeScreenshot}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <CameraIcon className="w-4 h-4" />
            Screenshot
          </button>
        </div>
        
        {/* Preview Area */}
        <div className={cn(
          "flex-1 flex items-center justify-center overflow-auto p-8",
          darkMode ? "bg-gray-900" : "bg-gray-100"
        )}>
          <div
            ref={previewRef}
            className="relative bg-black rounded-[40px] shadow-2xl overflow-hidden"
            style={{
              width: selectedDevice.width * (selectedDevice.scale || 0.6),
              height: selectedDevice.height * (selectedDevice.scale || 0.6),
            }}
          >
            {/* Device notch (for phones) */}
            {selectedDevice.icon === SmartphoneIcon && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-2xl z-20" />
            )}
            
            {/* Screen content */}
            <div className={cn(
              "absolute inset-2 rounded-[32px] overflow-hidden",
              darkMode ? "bg-gray-900" : "bg-white"
            )}>
              {/* Status bar */}
              <div className={cn(
                "h-8 flex items-center justify-between px-4 text-xs",
                darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
              )}>
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>
              
              {/* Content area based on placement */}
              <div className={cn(
                "flex-1 overflow-y-auto",
                darkMode ? "bg-gray-900" : "bg-white"
              )}>
                {placement === 'feed' && (
                  <div className="p-3 space-y-3">
                    {/* Fake post */}
                    <div className={cn(
                      "rounded-lg p-3",
                      darkMode ? "bg-gray-800" : "bg-gray-50"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                        <div>
                          <p className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>
                            Uživatel
                          </p>
                          <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>
                            Před 2 hodinami
                          </p>
                        </div>
                      </div>
                      <div className={cn("h-16 rounded", darkMode ? "bg-gray-700" : "bg-gray-200")} />
                    </div>
                    
                    {/* Ad */}
                    <div className={cn(
                      "rounded-lg overflow-hidden border",
                      darkMode ? "border-gray-700" : "border-gray-200"
                    )}>
                      <div className="relative">
                        <img 
                          src={displayedCreative.imageUrl} 
                          alt="Ad preview"
                          className="w-full"
                          style={{ maxHeight: 200, objectFit: 'contain' }}
                        />
                        <span className={cn(
                          "absolute top-1 left-1 px-1.5 py-0.5 text-[10px] rounded",
                          darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                        )}>
                          Sponzorováno
                        </span>
                      </div>
                      <div className={cn("p-2", darkMode ? "bg-gray-800" : "bg-white")}>
                        <p className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>
                          Reklamní sdělení
                        </p>
                        <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>
                          example.com
                        </p>
                      </div>
                    </div>
                    
                    {/* Another fake post */}
                    <div className={cn(
                      "rounded-lg p-3",
                      darkMode ? "bg-gray-800" : "bg-gray-50"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
                        <div>
                          <p className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>
                            Další uživatel
                          </p>
                        </div>
                      </div>
                      <div className={cn("h-24 rounded", darkMode ? "bg-gray-700" : "bg-gray-200")} />
                    </div>
                  </div>
                )}
                
                {placement === 'sidebar' && (
                  <div className="flex h-full">
                    {/* Main content */}
                    <div className={cn(
                      "flex-1 p-3 space-y-2",
                      darkMode ? "bg-gray-900" : "bg-white"
                    )}>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={cn(
                          "h-4 rounded",
                          darkMode ? "bg-gray-700" : "bg-gray-200"
                        )} style={{ width: `${70 + Math.random() * 30}%` }} />
                      ))}
                    </div>
                    {/* Sidebar with ad */}
                    <div className={cn(
                      "w-1/3 p-2 border-l",
                      darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                    )}>
                      <img 
                        src={displayedCreative.imageUrl} 
                        alt="Ad preview"
                        className="w-full rounded"
                      />
                      <p className={cn(
                        "text-[8px] mt-1",
                        darkMode ? "text-gray-500" : "text-gray-400"
                      )}>
                        Reklama
                      </p>
                    </div>
                  </div>
                )}
                
                {placement === 'interstitial' && (
                  <div className="h-full flex items-center justify-center p-4 relative">
                    <img 
                      src={displayedCreative.imageUrl} 
                      alt="Ad preview"
                      className="max-w-full max-h-full rounded-lg shadow-lg"
                    />
                    <button className={cn(
                      "absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-lg",
                      darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900 shadow"
                    )}>
                      ×
                    </button>
                    <p className={cn(
                      "absolute bottom-4 text-xs",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      Reklama • Přeskočit za 5s
                    </p>
                  </div>
                )}
                
                {placement === 'native' && (
                  <div className="p-3 space-y-3">
                    {/* Article header */}
                    <div>
                      <div className={cn(
                        "h-6 w-3/4 rounded mb-2",
                        darkMode ? "bg-gray-700" : "bg-gray-200"
                      )} />
                      <div className={cn(
                        "h-4 w-1/2 rounded",
                        darkMode ? "bg-gray-800" : "bg-gray-100"
                      )} />
                    </div>
                    
                    {/* Paragraphs */}
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-1">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className={cn(
                            "h-3 rounded",
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          )} style={{ width: `${70 + Math.random() * 30}%` }} />
                        ))}
                      </div>
                    ))}
                    
                    {/* Native ad */}
                    <div className={cn(
                      "rounded-lg overflow-hidden",
                      darkMode ? "bg-gray-800" : "bg-gray-50"
                    )}>
                      <div className="flex gap-2 p-2">
                        <img 
                          src={displayedCreative.imageUrl} 
                          alt="Ad preview"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className={cn(
                            "text-xs font-medium",
                            darkMode ? "text-white" : "text-gray-900"
                          )}>
                            Sponzorovaný článek
                          </p>
                          <p className={cn(
                            "text-[10px] line-clamp-2",
                            darkMode ? "text-gray-400" : "text-gray-600"
                          )}>
                            Objevte novou nabídku produktů a služeb, které změní váš každodenní život...
                          </p>
                          <span className={cn(
                            "text-[8px]",
                            darkMode ? "text-gray-500" : "text-gray-400"
                          )}>
                            Inzerce
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* More paragraphs */}
                    {[...Array(2)].map((_, i) => (
                      <div key={`after-${i}`} className="space-y-1">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className={cn(
                            "h-3 rounded",
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          )} style={{ width: `${70 + Math.random() * 30}%` }} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Bottom navigation (for phones) */}
              {selectedDevice.icon === SmartphoneIcon && (
                <div className={cn(
                  "h-12 flex items-center justify-around border-t",
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                )}>
                  {['🏠', '🔍', '➕', '❤️', '👤'].map((icon, i) => (
                    <span key={i} className="text-lg opacity-60">{icon}</span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Home indicator */}
            {selectedDevice.icon === SmartphoneIcon && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/30 rounded-full" />
            )}
          </div>
        </div>
        
        {/* Info bar */}
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-500 flex-shrink-0">
          <span>
            {selectedDevice.name} • {selectedDevice.width}×{selectedDevice.height}px • {PLACEMENTS.find(p => p.id === placement)?.description}
          </span>
          <span>
            {darkMode ? '🌙 Dark mode' : '☀️ Light mode'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MobilePreview
