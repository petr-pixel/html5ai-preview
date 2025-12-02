/**
 * Onboarding & Empty States
 * 
 * Komponenty pro nové uživatele a prázdné stavy.
 */

import { useState } from 'react'
import { 
  Sparkles, Image, Type, Download, Settings, 
  ArrowRight, CheckCircle, X, Lightbulb, Wand2,
  Upload, MousePointer, Palette, Zap
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

// ============================================================================
// WELCOME MODAL
// ============================================================================

interface WelcomeModalProps {
  onClose: () => void
  onOpenSettings: () => void
}

export function WelcomeModal({ onClose, onOpenSettings }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  
  const steps = [
    {
      icon: <Sparkles className="w-12 h-12 text-blue-500" />,
      title: 'Vítejte v AdCreative Studio!',
      description: 'Vytvářejte profesionální reklamní kreativy pro Sklik a Google Ads pomocí AI.',
    },
    {
      icon: <Settings className="w-12 h-12 text-purple-500" />,
      title: 'Nastavte OpenAI API klíč',
      description: 'Pro generování obrázků a textů potřebujete vlastní OpenAI API klíč. Platíte pouze za to, co použijete (~$0.04/obrázek).',
      action: {
        label: 'Otevřít nastavení',
        onClick: () => {
          onClose()
          onOpenSettings()
        },
      },
    },
    {
      icon: <Wand2 className="w-12 h-12 text-green-500" />,
      title: 'Jak to funguje',
      description: '1. Nahrajte nebo vygenerujte obrázek\n2. Vyberte formáty pro Sklik/Google\n3. Přidejte texty a logo\n4. Stáhněte hotové kreativy',
    },
  ]
  
  const currentStep = steps[step]
  const isLast = step === steps.length - 1
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 p-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="px-8 py-6 text-center">
          <div className="mb-6">{currentStep.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {currentStep.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {currentStep.description}
          </p>
          
          {currentStep.action && (
            <button
              onClick={currentStep.action.onClick}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {currentStep.action.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center px-8 py-4 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Přeskočit
          </button>
          
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Zpět
              </button>
            )}
            <button
              onClick={() => isLast ? onClose() : setStep(step + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isLast ? 'Začít' : 'Další'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY STATE: NO IMAGE
// ============================================================================

interface NoImageStateProps {
  onUpload: () => void
  onGenerate: () => void
}

export function NoImageState({ onUpload, onGenerate }: NoImageStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
      <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
        <Image className="w-10 h-10 text-blue-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Začněte s obrázkem
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        Nahrajte vlastní obrázek nebo nechte AI vygenerovat nový podle vašeho popisu.
      </p>
      
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onUpload}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <Upload className="w-5 h-5" />
          Nahrát obrázek
        </button>
        
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-sm"
        >
          <Sparkles className="w-5 h-5" />
          Generovat AI obrázek
        </button>
      </div>
      
      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left max-w-md">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Tip pro nejlepší výsledky
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Použijte obrázky s čistým pozadím a prostorem pro text. AI automaticky doplní chybějící části.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY STATE: NO FORMATS SELECTED
// ============================================================================

interface NoFormatsStateProps {
  onSelectFormats: () => void
}

export function NoFormatsState({ onSelectFormats }: NoFormatsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
        <MousePointer className="w-8 h-8 text-orange-500" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Vyberte formáty
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-4">
        Klikněte na formáty v levém panelu, které chcete vygenerovat.
      </p>
      
      <button
        onClick={onSelectFormats}
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
      >
        Vybrat všechny doporučené →
      </button>
    </div>
  )
}

// ============================================================================
// EMPTY STATE: NO CREATIVES
// ============================================================================

interface NoCreativesStateProps {
  onStartNew: () => void
}

export function NoCreativesState({ onStartNew }: NoCreativesStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Palette className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Zatím žádné kreativy
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        Vytvořte svou první reklamní kreativu. Vyberte obrázek, formáty a přidejte texty.
      </p>
      
      <button
        onClick={onStartNew}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Zap className="w-5 h-5" />
        Vytvořit první kreativu
      </button>
    </div>
  )
}

// ============================================================================
// API KEY MISSING BANNER
// ============================================================================

interface ApiKeyBannerProps {
  onOpenSettings: () => void
}

export function ApiKeyBanner({ onOpenSettings }: ApiKeyBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  
  if (dismissed) return null
  
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            <span className="font-medium">Nastavte OpenAI API klíč</span>
            {' '}pro generování obrázků a textů.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Nastavit
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// QUICK START GUIDE
// ============================================================================

export function QuickStartGuide() {
  const [currentStep, setCurrentStep] = useState(0)
  const sourceImage = useAppStore((s) => s.sourceImage)
  const selectedFormats = useAppStore((s) => s.selectedFormats)
  const creatives = useAppStore((s) => s.creatives)
  
  // Auto-advance based on app state
  const actualStep = 
    Object.keys(creatives).length > 0 ? 4 :
    selectedFormats.size > 0 ? 2 :
    sourceImage ? 1 : 0
  
  const steps = [
    { 
      label: 'Obrázek', 
      icon: <Image className="w-4 h-4" />,
      done: !!sourceImage,
    },
    { 
      label: 'Formáty', 
      icon: <MousePointer className="w-4 h-4" />,
      done: selectedFormats.size > 0,
    },
    { 
      label: 'Texty', 
      icon: <Type className="w-4 h-4" />,
      done: Object.keys(creatives).length > 0,
    },
    { 
      label: 'Export', 
      icon: <Download className="w-4 h-4" />,
      done: false,
    },
  ]
  
  return (
    <div className="flex items-center gap-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              step.done 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : i === actualStep
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500'
            }`}
          >
            {step.done ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              step.icon
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          
          {i < steps.length - 1 && (
            <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// FEATURE HIGHLIGHT
// ============================================================================

interface FeatureHighlightProps {
  feature: 'outpaint' | 'variants' | 'html5' | 'brandkit'
  onDismiss: () => void
}

export function FeatureHighlight({ feature, onDismiss }: FeatureHighlightProps) {
  const features = {
    outpaint: {
      title: 'AI Outpainting',
      description: 'Automaticky doplní chybějící části obrázku pro různé formáty.',
      icon: <Wand2 className="w-6 h-6 text-purple-500" />,
    },
    variants: {
      title: 'Varianty obrázků',
      description: 'Vygenerujte více variant jedním kliknutím pro A/B testování.',
      icon: <Sparkles className="w-6 h-6 text-blue-500" />,
    },
    html5: {
      title: 'HTML5 Bannery',
      description: 'Exportujte animované bannery kompatibilní s Google Ads.',
      icon: <Zap className="w-6 h-6 text-orange-500" />,
    },
    brandkit: {
      title: 'Brand Kit',
      description: 'Uložte si logo, barvy a fonty pro konzistentní kreativy.',
      icon: <Palette className="w-6 h-6 text-green-500" />,
    },
  }
  
  const f = features[feature]
  
  return (
    <div className="relative p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          {f.icon}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {f.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {f.description}
          </p>
        </div>
      </div>
    </div>
  )
}

export default {
  WelcomeModal,
  NoImageState,
  NoFormatsState,
  NoCreativesState,
  ApiKeyBanner,
  QuickStartGuide,
  FeatureHighlight,
}
