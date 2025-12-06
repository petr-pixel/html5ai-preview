import { useRef, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms, getFormatKey } from '@/lib/platforms'
import { loadImage, generateId } from '@/lib/utils'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { COLORS } from '@/lib/design-tokens'
import { TextOverlayEditor } from '@/components/TextOverlayEditor'
import { Card, CardHeader, Thumbnail, SecondaryButton, PrimaryLightButton, FormatCard } from '@/components/shared/UIComponents'
import type { PlatformId, Creative, Format } from '@/types'

interface CenterContentProps {
  onOpenTextEditor: () => void
  onEditFormat: (format: { key: string; format: Format } | null) => void
  onMagicResize: () => void
}

export function CenterContent({ onOpenTextEditor, onEditFormat, onMagicResize }: CenterContentProps) {
  const {
    platform, category, setCategory,
    sourceImage, setSourceImage,
    selectedFormats, toggleFormat, selectAllFormats,
    creatives, addCreatives, clearSelection,
    isGenerating, setIsGenerating, progress, setProgress,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formatSearch, setFormatSearch] = useState('')
  const [formatFilter, setFormatFilter] = useState(0)
  
  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform?.categories[category]
  const formats = currentCategory?.formats || []
  const creativesArray = Object.values(creatives)
  
  const filteredFormats = useMemo(() => {
    let result = formats
    
    if (formatSearch.trim()) {
      const search = formatSearch.toLowerCase()
      result = result.filter(f => 
        f.name.toLowerCase().includes(search) ||
        `${f.width}x${f.height}`.includes(search) ||
        `${f.width}×${f.height}`.includes(search)
      )
    }
    
    if (formatFilter === 1) {
      result = result.filter(f => Math.abs(f.width - f.height) < 50)
    } else if (formatFilter === 2) {
      result = result.filter(f => f.width > f.height * 1.1)
    } else if (formatFilter === 3) {
      result = result.filter(f => f.height > f.width * 1.1)
    }
    
    return result
  }, [formats, formatSearch, formatFilter])

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setSourceImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [setSourceImage])

  const handleGenerate = useCallback(async () => {
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
  }, [sourceImage, selectedFormats, setIsGenerating, setProgress, addCreatives])

  const handleSelectAll = () => {
    const allKeys = formats.map((_, i) => getFormatKey(platform, category, i))
    selectAllFormats(allKeys)
  }

  return (
    <div style={{ backgroundColor: COLORS.pageBg, overflow: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {currentPlatform && Object.entries(currentPlatform.categories).slice(0, 4).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: `1px solid ${category === key ? COLORS.textSecondary : COLORS.border}`,
                backgroundColor: category === key ? COLORS.cardBg : 'transparent',
                color: category === key ? COLORS.textPrimary : COLORS.textSecondary,
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
                boxShadow: category === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {cat.name}
            </button>
          ))}
          <button style={{
            padding: '8px 16px', borderRadius: 20, border: 'none',
            backgroundColor: 'transparent', color: COLORS.primary,
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            View more →
          </button>
        </div>

        {/* IMAGES CARD */}
        <Card>
          <div data-tour="upload">
          <CardHeader 
            title="Images" 
            count={`${creativesArray.length}/20`}
            completed={creativesArray.length > 0}
          />
          
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {sourceImage && <Thumbnail src={sourceImage} />}
              {creativesArray.slice(0, 4).map((c) => (
                <Thumbnail key={c.id} src={c.imageUrl} />
              ))}
              {creativesArray.length > 4 && (
                <div style={{
                  width: 48, height: 48, borderRadius: 8,
                  backgroundColor: COLORS.textPrimary, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                }}>
                  +{creativesArray.length - 4}
                </div>
              )}
              {!sourceImage && (
                <div style={{
                  width: 48, height: 48, borderRadius: 8,
                  border: `2px dashed ${COLORS.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: COLORS.textMuted,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <SecondaryButton onClick={() => fileInputRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {sourceImage ? 'Change' : 'Upload'}
              </SecondaryButton>
              <PrimaryLightButton 
                onClick={handleGenerate}
                disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
              >
                {isGenerating ? (
                  `Generating ${progress}%`
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Generate ({selectedFormats.size})
                  </>
                )}
              </PrimaryLightButton>
              <button
                onClick={onMagicResize}
                disabled={!sourceImage || selectedFormats.size === 0}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: sourceImage && selectedFormats.size > 0 ? 'pointer' : 'not-allowed',
                  opacity: sourceImage && selectedFormats.size > 0 ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="AI Magic Resize - automaticky přizpůsobí všechny formáty"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v18m-9-9h18M5 5l14 14M19 5L5 19"/>
                </svg>
                Magic ✨
              </button>
            </div>
          </div>

          {/* Format Grid */}
          <div style={{ padding: 20 }}>
            <div style={{ 
              display: 'flex', gap: 12, marginBottom: 16,
              alignItems: 'center',
            }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                backgroundColor: COLORS.pageBg,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Hledat formáty... (např. 300x250)"
                  value={formatSearch}
                  onChange={(e) => setFormatSearch(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: 13,
                    outline: 'none',
                    color: COLORS.textPrimary,
                  }}
                />
                {formatSearch && (
                  <button 
                    onClick={() => setFormatSearch('')}
                    style={{
                      border: 'none', backgroundColor: 'transparent',
                      color: COLORS.textMuted, cursor: 'pointer', padding: 2,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 4 }}>
                {['Všechny', 'Čtverec', 'Na šířku', 'Na výšku'].map((filter, i) => (
                  <button
                    key={filter}
                    onClick={() => setFormatFilter(i)}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      borderRadius: 6,
                      backgroundColor: formatFilter === i ? COLORS.primaryLight : 'transparent',
                      color: formatFilter === i ? COLORS.primary : COLORS.textMuted,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16 
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textSecondary }}>
                {filteredFormats.length === formats.length 
                  ? `Recommended formats (${formats.length})`
                  : `Nalezeno ${filteredFormats.length} z ${formats.length} formátů`
                }
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    padding: '6px 12px', border: 'none',
                    backgroundColor: 'transparent', color: COLORS.primary,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 6,
                  }}
                >
                  Select all
                </button>
                {selectedFormats.size > 0 && (
                  <button
                    onClick={clearSelection}
                    style={{
                      padding: '6px 12px', border: 'none',
                      backgroundColor: 'transparent', color: COLORS.textSecondary,
                      fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 6,
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {filteredFormats.slice(0, 8).map((format, index) => {
                const originalIndex = formats.indexOf(format)
                const formatKey = getFormatKey(platform, category, originalIndex)
                const isSelected = selectedFormats.has(formatKey)
                
                return (
                  <FormatCard
                    key={formatKey}
                    format={format}
                    selected={isSelected}
                    sourceImage={sourceImage}
                    onClick={() => toggleFormat(formatKey)}
                    onDoubleClick={() => sourceImage && onEditFormat({ key: formatKey, format })}
                    label={['From URL', 'Generated', 'Enhanced', 'Stock'][originalIndex % 4]}
                  />
                )
              })}
            </div>
            
            {filteredFormats.length === 0 && formatSearch && (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: COLORS.textMuted,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14 }}>Žádné formáty neodpovídají "{formatSearch}"</div>
              </div>
            )}
          </div>
          </div>
        </Card>

        {/* TEXT OVERLAY CARD */}
        <Card style={{ marginTop: 24 }}>
          <CardHeader title="Text Overlay" count="Optional" />
          <div style={{ padding: 20 }}>
            <TextOverlayEditor />
          </div>
        </Card>

        {/* LOGOS CARD */}
        <Card style={{ marginTop: 24 }}>
          <CardHeader title="Logos" count="4/5" completed />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{
                padding: '8px 12px', backgroundColor: COLORS.pageBg,
                borderRadius: 8, fontSize: 14, fontWeight: 700,
              }}>LOGO</div>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                backgroundColor: COLORS.textPrimary, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>L</div>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                border: `2px dashed ${COLORS.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: COLORS.textMuted, cursor: 'pointer',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            </div>
          </div>
        </Card>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}
