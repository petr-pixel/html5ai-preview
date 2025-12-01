/**
 * BrandKitManager 2.0 - Kompletní správa Brand Kitů
 */

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { generateId, cn } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'
import type { BrandKit } from '@/types'
import {
  Palette, Upload, Trash2, Check, Plus, Image, Type,
  Sun, Moon, Settings2, Eye, Copy, ChevronDown, ChevronUp,
  X, Edit3, Save,
} from 'lucide-react'

// @ts-expect-error - colorthief nemá typy
import ColorThief from 'colorthief'

// Helpers
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.5
}

function isSimilarColor(c1: string, c2: string, threshold = 50): boolean {
  const rgb1 = hexToRgb(c1), rgb2 = hexToRgb(c2)
  if (!rgb1 || !rgb2) return false
  return Math.sqrt(Math.pow(rgb1.r-rgb2.r,2)+Math.pow(rgb1.g-rgb2.g,2)+Math.pow(rgb1.b-rgb2.b,2)) < threshold
}

async function extractColors(imageUrl: string) {
  return new Promise<{primary: string, secondary: string}>((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const ct = new ColorThief()
        const dom = ct.getColor(img)
        const primary = rgbToHex(dom[0], dom[1], dom[2])
        const pal = ct.getPalette(img, 6).map((c: number[]) => rgbToHex(c[0], c[1], c[2]))
        let secondary = pal[1] || primary
        for (const c of pal) { if (!isSimilarColor(c, primary)) { secondary = c; break } }
        resolve({ primary, secondary })
      } catch (e) { reject(e) }
    }
    img.onerror = () => reject(new Error('Failed'))
    img.src = imageUrl
  })
}

const DEFAULT_KIT: Omit<BrandKit, 'id' | 'createdAt'> = {
  name: 'Nový Brand Kit',
  primaryColor: '#f97316',
  secondaryColor: '#1e293b',
  textLight: '#ffffff',
  textDark: '#1a1a1a',
  headlineTemplates: ['Objevte {produkt}', 'Sleva {sleva}% jen dnes', 'Novinka v nabídce', 'Doprava zdarma'],
  ctaTemplates: ['Koupit nyní', 'Zjistit více', 'Objednat', 'Zobrazit nabídku'],
  tagline: '',
  logoRules: { autoApply: true, position: 'bottom-right', size: 12, padding: 20, opacity: 100, autoSelectVariant: true },
  isDefault: false,
}

const POSITIONS = [
  { value: 'top-left', icon: '↖' },
  { value: 'top-right', icon: '↗' },
  { value: 'bottom-left', icon: '↙' },
  { value: 'bottom-right', icon: '↘' },
  { value: 'center', icon: '⊙' },
]

export function BrandKitManager() {
  const { brandKits, addBrandKit, updateBrandKit, deleteBrandKit, activeBrandKit, setActiveBrandKit } = useAppStore()
  const [selectedId, setSelectedId] = useState<string | null>(activeBrandKit || brandKits[0]?.id || null)
  const [isEditing, setIsEditing] = useState(false)
  const [editKit, setEditKit] = useState<BrandKit | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [section, setSection] = useState<string | null>('logos')
  const fileRef = useRef<HTMLInputElement>(null)
  const fileTypeRef = useRef<'main' | 'light' | 'dark'>('main')

  const selectedKit = brandKits.find(k => k.id === selectedId)

  const handleCreate = () => {
    const kit: BrandKit = { ...DEFAULT_KIT, id: generateId(), createdAt: new Date() }
    addBrandKit(kit)
    setSelectedId(kit.id)
    setEditKit(kit)
    setIsEditing(true)
  }

  const handleEdit = () => {
    if (!selectedKit) return
    setEditKit({
      ...selectedKit,
      textLight: selectedKit.textLight || '#ffffff',
      textDark: selectedKit.textDark || '#1a1a1a',
      headlineTemplates: selectedKit.headlineTemplates || DEFAULT_KIT.headlineTemplates,
      ctaTemplates: selectedKit.ctaTemplates || DEFAULT_KIT.ctaTemplates,
      logoRules: selectedKit.logoRules || DEFAULT_KIT.logoRules,
      logoMain: selectedKit.logoMain || selectedKit.logoSquare,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editKit) {
      updateBrandKit(editKit.id, { ...editKit, updatedAt: new Date() })
      setIsEditing(false)
      setEditKit(null)
    }
  }

  const handleLogoUpload = (type: 'main' | 'light' | 'dark') => {
    fileTypeRef.current = type
    fileRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editKit) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const url = ev.target?.result as string
      const type = fileTypeRef.current
      const updates: Partial<BrandKit> = {}
      if (type === 'main') {
        updates.logoMain = url
        setIsExtracting(true)
        try {
          const c = await extractColors(url)
          updates.primaryColor = c.primary
          updates.secondaryColor = c.secondary
        } catch {}
        setIsExtracting(false)
      } else if (type === 'light') updates.logoLight = url
      else updates.logoDark = url
      setEditKit({ ...editKit, ...updates })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const updateField = <K extends keyof BrandKit>(f: K, v: BrandKit[K]) => editKit && setEditKit({ ...editKit, [f]: v })
  const updateRule = (f: keyof BrandKit['logoRules'], v: any) => editKit && setEditKit({ ...editKit, logoRules: { ...editKit.logoRules, [f]: v } })

  const Section = ({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800" onClick={() => setSection(section === id ? null : id)}>
        <div className="flex items-center gap-3">{icon}<span className="font-medium">{title}</span></div>
        {section === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {section === id && <div className="p-4 border-t border-gray-700">{children}</div>}
    </div>
  )

  const Preview = () => {
    const kit = editKit || selectedKit
    if (!kit) return null
    return (
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="font-medium flex items-center gap-2 mb-4"><Eye className="w-4 h-4" />Náhled</h3>
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden" style={{ backgroundColor: kit.secondaryColor }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800)', backgroundSize: 'cover' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: kit.textLight }}>{kit.headlineTemplates?.[0]?.replace('{produkt}', 'novinky') || 'Headline'}</h2>
            <p className="text-sm mb-4 opacity-80" style={{ color: kit.textLight }}>{kit.tagline || 'Slogan'}</p>
            <button className="px-6 py-2 rounded-lg font-medium text-sm" style={{ backgroundColor: kit.primaryColor, color: isLightColor(kit.primaryColor) ? kit.textDark : kit.textLight }}>{kit.ctaTemplates?.[0] || 'CTA'}</button>
          </div>
          {kit.logoMain && (
            <div className="absolute" style={{
              [kit.logoRules?.position?.includes('top') ? 'top' : 'bottom']: kit.logoRules?.padding || 20,
              [kit.logoRules?.position?.includes('left') ? 'left' : 'right']: kit.logoRules?.padding || 20,
              opacity: (kit.logoRules?.opacity || 100) / 100,
            }}>
              <img src={kit.logoMain} alt="" className="h-8 w-auto" />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          {[['Primary', kit.primaryColor], ['Secondary', kit.secondaryColor], ['Light', kit.textLight], ['Dark', kit.textDark]].map(([n, c]) => (
            <div key={n} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-600" style={{ backgroundColor: c as string }} />
              <span className="text-xs text-gray-400">{n}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-950 text-white">
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-orange-500" />Brand Kity</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {brandKits.length === 0 ? (
            <div className="text-center text-gray-500 py-8"><Palette className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Žádné brand kity</p></div>
          ) : (
            <div className="space-y-1">
              {brandKits.map(kit => (
                <button key={kit.id} onClick={() => { setSelectedId(kit.id); isEditing && (setIsEditing(false), setEditKit(null)) }}
                  className={cn("w-full p-3 rounded-lg text-left", selectedId === kit.id ? "bg-orange-600/20 border border-orange-500/50" : "bg-gray-800 hover:bg-gray-750")}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: kit.primaryColor }}>
                      {kit.logoMain ? <img src={kit.logoMain} className="w-5 h-5 object-contain" /> : <Palette className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{kit.name}</div>
                      <div className="flex gap-1 mt-1">
                        <div className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: kit.primaryColor }} />
                        <div className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: kit.secondaryColor }} />
                      </div>
                    </div>
                    {activeBrandKit === kit.id && <Badge className="bg-green-600 text-[10px]">Aktivní</Badge>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-gray-800">
          <Button onClick={handleCreate} className="w-full bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-2" />Nový Brand Kit</Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedKit ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h1 className="text-xl font-semibold">{isEditing ? editKit?.name : selectedKit.name}</h1>
                <p className="text-sm text-gray-400">{isEditing ? 'Úprava' : 'Zobrazení'}</p>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" onClick={() => { setIsEditing(false); setEditKit(null) }}>Zrušit</Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Uložit</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => { const n = { ...selectedKit, id: generateId(), name: selectedKit.name + ' (kopie)', createdAt: new Date(), isDefault: false }; addBrandKit(n); setSelectedId(n.id) }}><Copy className="w-4 h-4 mr-2" />Duplikovat</Button>
                    {activeBrandKit !== selectedKit.id && <Button variant="ghost" onClick={() => setActiveBrandKit(selectedKit.id)}><Check className="w-4 h-4 mr-2" />Aktivovat</Button>}
                    <Button variant="ghost" onClick={() => { if (confirm('Smazat?')) { deleteBrandKit(selectedKit.id); setSelectedId(brandKits.find(k => k.id !== selectedKit.id)?.id || null) } }} className="text-red-400"><Trash2 className="w-4 h-4 mr-2" />Smazat</Button>
                    <Button onClick={handleEdit} className="bg-orange-600 hover:bg-orange-700"><Edit3 className="w-4 h-4 mr-2" />Upravit</Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto grid grid-cols-[1fr,350px] gap-6">
                <div className="space-y-4">
                  {isEditing && editKit ? (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Název</label>
                        <input type="text" value={editKit.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2" />
                      </div>

                      <Section id="logos" title="Loga" icon={<Image className="w-4 h-4" />}>
                        <p className="text-sm text-gray-400 mb-4">Nahrajte logo ve 3 variantách.</p>
                        <div className="grid grid-cols-3 gap-4">
                          {(['main', 'light', 'dark'] as const).map(type => (
                            <div key={type}>
                              <label className="block text-xs text-gray-400 mb-2 flex items-center gap-1">
                                {type === 'main' ? 'Hlavní' : type === 'light' ? <><Sun className="w-3 h-3" /> Pro tmavé</> : <><Moon className="w-3 h-3" /> Pro světlé</>}
                              </label>
                              <button onClick={() => handleLogoUpload(type)}
                                className={cn("w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-orange-500",
                                  type === 'dark' ? "bg-white border-gray-300" : "bg-gray-800 border-gray-700")}>
                                {editKit[type === 'main' ? 'logoMain' : type === 'light' ? 'logoLight' : 'logoDark'] ? (
                                  <img src={editKit[type === 'main' ? 'logoMain' : type === 'light' ? 'logoLight' : 'logoDark']} className="max-w-[80%] max-h-[80%] object-contain" />
                                ) : <><Upload className={cn("w-6 h-6 mb-2", type === 'dark' ? "text-gray-400" : "text-gray-500")} /><span className={cn("text-xs", type === 'dark' ? "text-gray-400" : "text-gray-500")}>Nahrát</span></>}
                              </button>
                              {type === 'main' && isExtracting && <p className="text-xs text-orange-400 mt-1">Extrahuji barvy...</p>}
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section id="colors" title="Barvy" icon={<Palette className="w-4 h-4" />}>
                        <div className="grid grid-cols-2 gap-4">
                          {[['primaryColor', 'Primary (CTA)'], ['secondaryColor', 'Secondary'], ['textLight', 'Text Light'], ['textDark', 'Text Dark']].map(([f, l]) => (
                            <div key={f}>
                              <label className="block text-xs text-gray-400 mb-2">{l}</label>
                              <div className="flex gap-2">
                                <input type="color" value={(editKit as any)[f]} onChange={e => updateField(f as keyof BrandKit, e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                                <input type="text" value={(editKit as any)[f]} onChange={e => updateField(f as keyof BrandKit, e.target.value)} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm font-mono" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>

                      <Section id="templates" title="Textové šablony" icon={<Type className="w-4 h-4" />}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Tagline</label>
                            <input type="text" value={editKit.tagline || ''} onChange={e => updateField('tagline', e.target.value)} placeholder="Slogan..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2"><label className="text-xs text-gray-400">Headlines</label><button onClick={() => { const t = prompt('Nová headline:'); t && updateField('headlineTemplates', [...(editKit.headlineTemplates || []), t]) }} className="text-xs text-orange-400">+ Přidat</button></div>
                            <div className="space-y-2">
                              {editKit.headlineTemplates?.map((t, i) => (
                                <div key={i} className="flex gap-2">
                                  <input type="text" value={t} onChange={e => { const n = [...(editKit.headlineTemplates || [])]; n[i] = e.target.value; updateField('headlineTemplates', n) }} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm" />
                                  <button onClick={() => updateField('headlineTemplates', editKit.headlineTemplates?.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-2"><label className="text-xs text-gray-400">CTA</label><button onClick={() => { const t = prompt('Nová CTA:'); t && updateField('ctaTemplates', [...(editKit.ctaTemplates || []), t]) }} className="text-xs text-orange-400">+ Přidat</button></div>
                            <div className="flex flex-wrap gap-2">
                              {editKit.ctaTemplates?.map((t, i) => (
                                <div key={i} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
                                  <span className="text-sm">{t}</span>
                                  <button onClick={() => updateField('ctaTemplates', editKit.ctaTemplates?.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Section>

                      <Section id="rules" title="Pravidla loga" icon={<Settings2 className="w-4 h-4" />}>
                        <div className="space-y-4">
                          <label className="flex items-center gap-3"><input type="checkbox" checked={editKit.logoRules?.autoApply ?? true} onChange={e => updateRule('autoApply', e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm">Auto-přidávat logo</span></label>
                          <label className="flex items-center gap-3"><input type="checkbox" checked={editKit.logoRules?.autoSelectVariant ?? true} onChange={e => updateRule('autoSelectVariant', e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm">Auto-výběr light/dark</span></label>
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Pozice</label>
                            <div className="grid grid-cols-5 gap-2">
                              {POSITIONS.map(p => (
                                <button key={p.value} onClick={() => updateRule('position', p.value)} className={cn("p-2 rounded-lg border text-center text-lg", editKit.logoRules?.position === p.value ? "border-orange-500 bg-orange-500/20" : "border-gray-700")}>{p.icon}</button>
                              ))}
                            </div>
                          </div>
                          <div><label className="block text-xs text-gray-400 mb-2">Velikost: {editKit.logoRules?.size || 12}%</label><input type="range" min={5} max={30} value={editKit.logoRules?.size || 12} onChange={e => updateRule('size', +e.target.value)} className="w-full accent-orange-500" /></div>
                          <div><label className="block text-xs text-gray-400 mb-2">Odsazení: {editKit.logoRules?.padding || 20}px</label><input type="range" min={0} max={50} value={editKit.logoRules?.padding || 20} onChange={e => updateRule('padding', +e.target.value)} className="w-full accent-orange-500" /></div>
                          <div><label className="block text-xs text-gray-400 mb-2">Průhlednost: {editKit.logoRules?.opacity || 100}%</label><input type="range" min={10} max={100} value={editKit.logoRules?.opacity || 100} onChange={e => updateRule('opacity', +e.target.value)} className="w-full accent-orange-500" /></div>
                        </div>
                      </Section>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Loga</h3>
                        <div className="flex gap-4">
                          {[['logoMain', 'bg-gray-800'], ['logoLight', 'bg-gray-900'], ['logoDark', 'bg-white']].map(([k, bg]) => 
                            (selectedKit as any)[k] && <div key={k} className={cn("w-24 h-24 rounded-lg flex items-center justify-center p-2", bg)}><img src={(selectedKit as any)[k]} className="max-w-full max-h-full object-contain" /></div>
                          )}
                          {!selectedKit.logoMain && <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500"><Image className="w-8 h-8" /></div>}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Barvy</h3>
                        <div className="flex gap-4">
                          {[['Primary', selectedKit.primaryColor], ['Secondary', selectedKit.secondaryColor], ['Light', selectedKit.textLight || '#fff'], ['Dark', selectedKit.textDark || '#1a1a1a']].map(([n, c]) => (
                            <div key={n} className="text-center"><div className="w-16 h-16 rounded-lg border border-gray-700 mb-1" style={{ backgroundColor: c }} /><span className="text-xs text-gray-500">{n}</span></div>
                          ))}
                        </div>
                      </div>
                      {selectedKit.tagline && <p className="text-lg italic">"{selectedKit.tagline}"</p>}
                      {selectedKit.ctaTemplates?.length && (
                        <div className="flex flex-wrap gap-2">
                          {selectedKit.ctaTemplates.map((c, i) => <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: selectedKit.primaryColor, color: isLightColor(selectedKit.primaryColor) ? '#1a1a1a' : '#fff' }}>{c}</span>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div><Preview /></div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Palette className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Žádný brand kit</p>
              <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-2" />Vytvořit Brand Kit</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrandKitManager
