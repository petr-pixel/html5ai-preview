/**
 * BrandKitManager - Správa Brand Kitů
 * 
 * Umožňuje vytvářet, upravovat a aplikovat Brand Kity na kreativy.
 * Automatická extrakce barev z loga pomocí ColorThief.
 */

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { generateId } from '@/lib/utils'
import { Button, Input, Card, Badge } from '@/components/ui'
import type { BrandKit } from '@/types'
import { 
  Palette, 
  Upload, 
  Trash2, 
  Check, 
  Plus, 
  Image,
  Type,
  Sparkles,
  Wand2,
  Loader2
} from 'lucide-react'

// @ts-expect-error - colorthief nemá typy
import ColorThief from 'colorthief'

interface BrandKitManagerProps {
  onApply?: (kit: BrandKit) => void
}

/**
 * Extrahuje dominantní barvy z obrázku
 */
async function extractColorsFromImage(imageUrl: string): Promise<{
  primary: string
  secondary: string
  palette: string[]
}> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief()
        
        // Dominantní barva
        const dominant = colorThief.getColor(img)
        const primary = rgbToHex(dominant[0], dominant[1], dominant[2])
        
        // Paleta barev (5 barev)
        const paletteRgb = colorThief.getPalette(img, 5)
        const palette = paletteRgb.map((rgb: number[]) => 
          rgbToHex(rgb[0], rgb[1], rgb[2])
        )
        
        // Sekundární barva - první z palety co není podobná primární
        let secondary = palette[1] || primary
        for (const color of palette) {
          if (!isSimilarColor(color, primary)) {
            secondary = color
            break
          }
        }
        
        resolve({ primary, secondary, palette })
      } catch (err) {
        reject(err)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function isSimilarColor(color1: string, color2: string, threshold = 50): boolean {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return false
  
  const diff = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  )
  
  return diff < threshold
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function BrandKitManager({ onApply }: BrandKitManagerProps) {
  const { brandKits, activeBrandKit, addBrandKit, setBrandKits, setActiveBrandKit } = useAppStore()
  const [isCreating, setIsCreating] = useState(false)
  const [isExtractingColors, setIsExtractingColors] = useState(false)
  
  const squareLogoRef = useRef<HTMLInputElement>(null)
  const horizontalLogoRef = useRef<HTMLInputElement>(null)

  const [newKit, setNewKit] = useState<Partial<BrandKit>>({
    name: '',
    primaryColor: '#1a73e8',
    secondaryColor: '#34a853',
    ctaColor: '#1a73e8',
    textColor: '#ffffff',
    backgroundColor: '#000000',
  })

  const handleCreateKit = () => {
    if (!newKit.name) return

    const kit: BrandKit = {
      id: generateId(),
      name: newKit.name,
      logoSquare: newKit.logoSquare,
      logoHorizontal: newKit.logoHorizontal,
      primaryColor: newKit.primaryColor || '#1a73e8',
      secondaryColor: newKit.secondaryColor || '#34a853',
      ctaColor: newKit.ctaColor || '#1a73e8',
      textColor: newKit.textColor || '#ffffff',
      backgroundColor: newKit.backgroundColor || '#000000',
      headlineFont: newKit.headlineFont,
      bodyFont: newKit.bodyFont,
      createdAt: new Date(),
      isDefault: brandKits.length === 0,
    }

    addBrandKit(kit)
    setIsCreating(false)
    setNewKit({
      name: '',
      primaryColor: '#1a73e8',
      secondaryColor: '#34a853',
      ctaColor: '#1a73e8',
      textColor: '#ffffff',
      backgroundColor: '#000000',
    })
  }

  const handleDeleteKit = (id: string) => {
    setBrandKits(brandKits.filter(k => k.id !== id))
    if (activeBrandKit === id) {
      setActiveBrandKit(null)
    }
  }

  const handleSelectKit = (kit: BrandKit) => {
    setActiveBrandKit(kit.id)
    onApply?.(kit)
  }

  const handleLogoUpload = async (type: 'square' | 'horizontal', file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      
      // Ulož logo
      if (type === 'square') {
        setNewKit(prev => ({ ...prev, logoSquare: dataUrl }))
      } else {
        setNewKit(prev => ({ ...prev, logoHorizontal: dataUrl }))
      }
      
      // Automaticky extrahuj barvy z loga
      setIsExtractingColors(true)
      try {
        const colors = await extractColorsFromImage(dataUrl)
        setNewKit(prev => ({
          ...prev,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          ctaColor: colors.primary, // CTA = primární barva
        }))
      } catch (err) {
        console.warn('Failed to extract colors:', err)
      } finally {
        setIsExtractingColors(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const activeKit = brandKits.find(k => k.id === activeBrandKit)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Brand Kit</h3>
        </div>
        {!isCreating && (
          <Button size="sm" variant="outline" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4" />
            Nový
          </Button>
        )}
      </div>

      {/* Seznam existujících Brand Kitů */}
      {brandKits.length > 0 && !isCreating && (
        <div className="space-y-2 mb-4">
          {brandKits.map(kit => (
            <div
              key={kit.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                activeBrandKit === kit.id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-border hover:border-purple-300'
              }`}
              onClick={() => handleSelectKit(kit)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Logo preview */}
                  {kit.logoSquare ? (
                    <img 
                      src={kit.logoSquare} 
                      alt={kit.name} 
                      className="w-8 h-8 rounded object-contain bg-white border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <Image className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {kit.name}
                      {kit.isDefault && (
                        <Badge variant="secondary" className="text-xs">Výchozí</Badge>
                      )}
                    </div>
                    {/* Color swatches */}
                    <div className="flex gap-1 mt-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-white shadow-sm" 
                        style={{ backgroundColor: kit.primaryColor }}
                        title="Primary"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-white shadow-sm" 
                        style={{ backgroundColor: kit.secondaryColor }}
                        title="Secondary"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-white shadow-sm" 
                        style={{ backgroundColor: kit.ctaColor }}
                        title="CTA"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeBrandKit === kit.id && (
                    <Check className="w-4 h-4 text-purple-500" />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteKit(kit.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vytvoření nového Brand Kitu */}
      {isCreating && (
        <div className="space-y-4 border-t pt-4">
          <Input
            placeholder="Název Brand Kitu"
            value={newKit.name || ''}
            onChange={(e) => setNewKit(prev => ({ ...prev, name: e.target.value }))}
          />

          {/* Loga */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Logo čtvercové (1:1)</label>
              <input
                ref={squareLogoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload('square', file)
                }}
              />
              <div
                className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 transition-colors overflow-hidden"
                onClick={() => squareLogoRef.current?.click()}
              >
                {newKit.logoSquare ? (
                  <img src={newKit.logoSquare} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Logo horizontální (4:1)</label>
              <input
                ref={horizontalLogoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload('horizontal', file)
                }}
              />
              <div
                className="aspect-[4/1] border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 transition-colors overflow-hidden"
                onClick={() => horizontalLogoRef.current?.click()}
              >
                {newKit.logoHorizontal ? (
                  <img src={newKit.logoHorizontal} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Barvy */}
          <div>
            <label className="text-sm font-medium mb-2 block">Barvy</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: 'primaryColor', label: 'Primary' },
                { key: 'secondaryColor', label: 'Secondary' },
                { key: 'ctaColor', label: 'CTA' },
                { key: 'textColor', label: 'Text' },
                { key: 'backgroundColor', label: 'Pozadí' },
              ].map(({ key, label }) => (
                <div key={key} className="text-center">
                  <input
                    type="color"
                    value={(newKit as Record<string, string>)[key] || '#000000'}
                    onChange={(e) => setNewKit(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full h-10 rounded cursor-pointer border-0"
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fonty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <Type className="w-4 h-4" />
                Headline Font
              </label>
              <Input
                placeholder="např. Montserrat"
                value={newKit.headlineFont || ''}
                onChange={(e) => setNewKit(prev => ({ ...prev, headlineFont: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <Type className="w-4 h-4" />
                Body Font
              </label>
              <Input
                placeholder="např. Open Sans"
                value={newKit.bodyFont || ''}
                onChange={(e) => setNewKit(prev => ({ ...prev, bodyFont: e.target.value }))}
              />
            </div>
          </div>

          {/* Akce */}
          <div className="flex gap-2">
            <Button onClick={handleCreateKit} disabled={!newKit.name}>
              <Sparkles className="w-4 h-4" />
              Vytvořit Brand Kit
            </Button>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Zrušit
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {brandKits.length === 0 && !isCreating && (
        <div className="text-center py-6 text-muted-foreground">
          <Palette className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Zatím nemáte žádný Brand Kit</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4" />
            Vytvořit první
          </Button>
        </div>
      )}

      {/* Aktivní Brand Kit info */}
      {activeKit && !isCreating && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Aktivní: <strong>{activeKit.name}</strong> – barvy a logo budou aplikovány na kreativy
          </p>
        </div>
      )}
    </Card>
  )
}

/**
 * Kompaktní verze pro sidebar
 */
export function BrandKitSelector() {
  const { brandKits, activeBrandKit, setActiveBrandKit, setTextOverlay } = useAppStore()

  if (brandKits.length === 0) return null

  const handleApply = (kit: BrandKit) => {
    setActiveBrandKit(kit.id)
    // Aplikuj barvu CTA
    setTextOverlay({ ctaColor: kit.ctaColor })
  }

  return (
    <div className="flex items-center gap-2">
      <Palette className="w-4 h-4 text-muted-foreground" />
      <select
        value={activeBrandKit || ''}
        onChange={(e) => {
          const kit = brandKits.find(k => k.id === e.target.value)
          if (kit) handleApply(kit)
          else setActiveBrandKit(null)
        }}
        className="text-sm border rounded px-2 py-1 bg-background"
      >
        <option value="">Bez Brand Kitu</option>
        {brandKits.map(kit => (
          <option key={kit.id} value={kit.id}>{kit.name}</option>
        ))}
      </select>
    </div>
  )
}
