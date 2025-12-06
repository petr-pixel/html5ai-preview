import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { COLORS } from '@/lib/design-tokens'

const QUICK_TEMPLATES = [
  { id: 'sale', name: 'Slevová akce', icon: '🏷️', industry: 'E-commerce', colors: ['#ef4444', '#fbbf24'], headlines: ['Sleva až 50%!', 'Výprodej sezóny'], ctas: ['Nakoupit', 'Využít slevu'] },
  { id: 'restaurant', name: 'Restaurace', icon: '🍽️', industry: 'Gastronomie', colors: ['#dc2626', '#f97316'], headlines: ['Ochutnejte novinky', 'Rezervujte stůl'], ctas: ['Rezervovat', 'Menu'] },
  { id: 'travel', name: 'Cestování', icon: '✈️', industry: 'Turistika', colors: ['#0ea5e9', '#06b6d4'], headlines: ['Dovolená snů', 'Last minute'], ctas: ['Prohlédnout', 'Rezervovat'] },
  { id: 'realestate', name: 'Reality', icon: '🏠', industry: 'Nemovitosti', colors: ['#10b981', '#059669'], headlines: ['Najděte svůj domov', 'Nové byty'], ctas: ['Prohlédnout', 'Kontakt'] },
  { id: 'auto', name: 'Automobily', icon: '🚗', industry: 'Automotive', colors: ['#1e40af', '#3b82f6'], headlines: ['Nový model', 'Test drive'], ctas: ['Více info', 'Objednat'] },
  { id: 'health', name: 'Zdraví', icon: '💊', industry: 'Healthcare', colors: ['#059669', '#34d399'], headlines: ['Pečujte o zdraví', 'Konzultace'], ctas: ['Objednat', 'Více info'] },
  { id: 'tech', name: 'Technologie', icon: '💻', industry: 'IT', colors: ['#6366f1', '#8b5cf6'], headlines: ['Inovativní řešení', 'Nová technologie'], ctas: ['Zjistit více', 'Demo'] },
  { id: 'fashion', name: 'Móda', icon: '👗', industry: 'Fashion', colors: ['#ec4899', '#f472b6'], headlines: ['Nová kolekce', 'Trendy sezóny'], ctas: ['Nakoupit', 'Kolekce'] },
]

interface TemplateLibraryModalProps {
  onClose: () => void
}

export function TemplateLibraryModal({ onClose }: TemplateLibraryModalProps) {
  const { setTextOverlay } = useAppStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  
  const filteredTemplates = QUICK_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.industry.toLowerCase().includes(search.toLowerCase())
  )
  
  const selectedTemplate = QUICK_TEMPLATES.find(t => t.id === selectedId)
  
  const handleApply = () => {
    if (selectedTemplate) {
      setTextOverlay({
        headline: selectedTemplate.headlines[0],
        subheadline: '',
        cta: selectedTemplate.ctas[0],
      })
      onClose()
    }
  }
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: COLORS.cardBg, borderRadius: 16,
        width: 700, maxWidth: '90%', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>📋 Template Library</h3>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.textSecondary }}>
                Vyberte šablonu pro rychlý start
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, border: 'none', borderRadius: 8,
              backgroundColor: COLORS.pageBg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Hledat šablonu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              fontSize: 14, outline: 'none',
            }}
          />
        </div>
        
        {/* Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: `2px solid ${selectedId === template.id ? COLORS.primary : COLORS.border}`,
                  backgroundColor: selectedId === template.id ? COLORS.primaryLight : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>
                  {template.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>
                  {template.name}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>
                  {template.industry}
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                  {template.colors.map((c, i) => (
                    <div key={i} style={{
                      width: 16, height: 16, borderRadius: 4,
                      backgroundColor: c, border: '1px solid rgba(0,0,0,0.1)',
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Preview & Actions */}
        {selectedTemplate && (
          <div style={{ 
            padding: '16px 24px', 
            borderTop: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.pageBg,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>
                  Preview headlines:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedTemplate.headlines.map((h, i) => (
                    <span key={i} style={{
                      padding: '4px 10px', backgroundColor: 'white',
                      borderRadius: 6, fontSize: 12, fontWeight: 500,
                      border: `1px solid ${COLORS.border}`,
                    }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={handleApply} style={{
                padding: '12px 24px', border: 'none', borderRadius: 8,
                backgroundColor: COLORS.primary, color: 'white',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                Použít šablonu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
