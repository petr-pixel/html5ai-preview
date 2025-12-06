import { useState } from 'react'
import { COLORS } from '@/lib/design-tokens'

interface WelcomeModalProps {
  onClose: () => void
  onOpenSettings: () => void
  onStartTour: () => void
}

export function WelcomeModal({ onClose, onOpenSettings, onStartTour }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  
  const steps = [
    { icon: '✨', title: 'Vítejte v AdCreative Studio!', desc: 'Vytvářejte profesionální reklamní kreativy pro Sklik a Google Ads pomocí AI.' },
    { icon: '🔑', title: 'OpenAI API klíč', desc: 'Pro AI funkce potřebujete vlastní OpenAI API klíč. Platíte pouze za použití (~$0.04/obrázek).', action: 'settings' },
    { icon: '🚀', title: 'Jak to funguje', desc: '1. Nahrajte obrázek\n2. Vyberte formáty\n3. Přidejte texty\n4. Stáhněte kreativy', action: 'tour' },
  ]
  
  const current = steps[step]
  const isLast = step === steps.length - 1
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: COLORS.cardBg, borderRadius: 16,
        width: 420, maxWidth: '90%', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, padding: 16 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              backgroundColor: i <= step ? COLORS.primary : COLORS.borderLight,
              transition: 'background-color 0.3s',
            }} />
          ))}
        </div>
        
        {/* Content */}
        <div style={{ padding: '24px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{current.icon}</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 600 }}>{current.title}</h2>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textSecondary, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {current.desc}
          </p>
          
          {current.action === 'settings' && (
            <button onClick={() => { onClose(); onOpenSettings() }} style={{
              marginTop: 20, padding: '12px 24px', border: 'none', borderRadius: 8,
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Otevřít nastavení →
            </button>
          )}
          
          {current.action === 'tour' && (
            <button onClick={onStartTour} style={{
              marginTop: 20, padding: '12px 24px', border: 'none', borderRadius: 8,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              🎯 Spustit interaktivní průvodce
            </button>
          )}
        </div>
        
        {/* Actions */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', backgroundColor: COLORS.pageBg,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', border: 'none', backgroundColor: 'transparent',
            color: COLORS.textMuted, fontSize: 14, cursor: 'pointer',
          }}>
            Přeskočit
          </button>
          
          <button onClick={() => isLast ? onClose() : setStep(s => s + 1)} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8,
            backgroundColor: COLORS.primary, color: 'white',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            {isLast ? 'Začít' : 'Další'}
          </button>
        </div>
      </div>
    </div>
  )
}
