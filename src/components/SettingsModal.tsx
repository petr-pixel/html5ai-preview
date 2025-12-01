import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { testApiKey } from '@/lib/openai-client'
import { PRESET_SOURCES, ALL_PRESETS } from '@/lib/format-presets'
import { formatStorageSize, getStoragePercentage } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@/components/ui'
import { 
  Key, 
  Bot, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronRight,
  Cloud,
  Database,
  Sparkles,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Převést PRESET_SOURCES objekt na pole pro zobrazení
const formatSourcesArray = [
  { name: 'Sklik - Bannery', url: PRESET_SOURCES.sklik.bannery },
  { name: 'Sklik - HTML5 bannery', url: PRESET_SOURCES.sklik.html5 },
  { name: 'Sklik - Branding', url: PRESET_SOURCES.sklik.branding },
  { name: 'Sklik - Kombinovaná reklama', url: PRESET_SOURCES.sklik.kombinovana },
  { name: 'Sklik - Přehled formátů', url: PRESET_SOURCES.sklik.formaty },
  { name: 'Google Ads - Display', url: PRESET_SOURCES.google.display },
  { name: 'Google Ads - Specifikace', url: PRESET_SOURCES.google.specs },
  { name: 'Google Ads - Performance Max', url: PRESET_SOURCES.google.pmax },
  { name: 'Google Ads - Demand Gen', url: PRESET_SOURCES.google.demandgen },
]

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { apiKeys, setApiKeys } = useAppStore()
  const { profile } = useAuth()
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [showFormatSources, setShowFormatSources] = useState(false)
  const [activeTab, setActiveTab] = useState<'api' | 'storage' | 'formats'>('api')

  const handleTest = async () => {
    if (!apiKeys.openai) {
      setTestStatus('error')
      setTestMessage('Zadejte API klíč')
      return
    }

    setTestStatus('testing')
    setTestMessage('Testování připojení...')

    try {
      const result = await testApiKey(apiKeys.openai)
      if (result.success) {
        setTestStatus('success')
        setTestMessage(result.message || 'Připojení úspěšné')
      } else {
        setTestStatus('error')
        setTestMessage(result.message || 'Připojení selhalo')
      }
    } catch (err) {
      setTestStatus('error')
      setTestMessage('Chyba při testování')
    }
  }

  const handleSave = () => {
    onOpenChange(false)
  }

  // Počty formátů podle platformy
  const formatCounts = {
    google: ALL_PRESETS.filter(p => p.platform === 'google').length,
    sklik: ALL_PRESETS.filter(p => p.platform === 'sklik').length,
    total: ALL_PRESETS.length,
  }

  // Storage info z profilu
  const storageUsed = profile?.storage_used || 0
  const storageLimit = profile?.storage_limit || 100 * 1024 * 1024 // 100 MB default
  const storagePercent = getStoragePercentage(storageUsed, storageLimit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white">Nastavení</DialogTitle>
              <p className="text-sm text-white/60">API klíče a konfigurace</p>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4 border border-white/10">
          <button
            onClick={() => setActiveTab('api')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'api'
                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white border border-violet-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Key className="w-4 h-4" />
            API
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'storage'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Database className="w-4 h-4" />
            Storage
          </button>
          <button
            onClick={() => setActiveTab('formats')}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'formats'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <FileText className="w-4 h-4" />
            Formáty
          </button>
        </div>

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            {/* OpenAI API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                OpenAI API klíč
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({ openai: e.target.value })}
                  placeholder="sk-..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:ring-violet-500/20"
                />
                {apiKeys.openai && (
                  <button
                    onClick={() => setApiKeys({ openai: '' })}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-white/40">
                Jeden klíč pro GPT-4o (obrázky i texty) a Sora (video).
              </p>
              
              {/* Test Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTest}
                disabled={testStatus === 'testing' || !apiKeys.openai}
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testování...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                    Připojeno
                  </>
                ) : testStatus === 'error' ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2 text-red-400" />
                    Chyba
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Otestovat připojení
                  </>
                )}
              </Button>

              {testMessage && (
                <p className={cn(
                  'text-sm px-3 py-2 rounded-lg',
                  testStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  testStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-white/5 text-white/60'
                )}>
                  {testMessage}
                </p>
              )}
            </div>

            {/* Help Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Kde získat API klíč?
              </h4>
              <p className="text-sm text-white/60 mb-2">
                Přejděte na{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  platform.openai.com/api-keys
                </a>
                {' '}a vytvořte nový klíč.
              </p>
              <p className="text-xs text-white/40">
                Doporučujeme nastavit spending limit.
              </p>
            </div>

            {/* Pricing Info */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-sm font-medium text-white/80 mb-3">Orientační ceny</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">GPT-4o obrázky:</span>
                  <span className="text-white/80">$0.01-0.17</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">GPT-4o texty:</span>
                  <span className="text-white/80">$2.50/1M tokenů</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-white/50">Slideshow:</span>
                  <span className="text-emerald-400">zdarma (lokální)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Cloud Storage</h4>
                  <p className="text-sm text-white/50">Cloud úložiště pro vaše kreativy</p>
                </div>
              </div>

              {/* Usage bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Využité místo</span>
                  <span className="font-medium text-white">
                    {formatStorageSize(storageUsed)} / {formatStorageSize(storageLimit)}
                  </span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      storagePercent > 90 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                        : storagePercent > 70 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500' 
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    )}
                    style={{ width: `${Math.min(100, storagePercent)}%` }}
                  />
                </div>
                <p className="text-xs text-white/40">
                  {storagePercent}% využito · Zbývá {formatStorageSize(storageLimit - storageUsed)}
                </p>
              </div>
            </div>

            {/* Plan Info */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Váš plán</span>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  profile?.plan === 'pro' 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30'
                    : profile?.plan === 'enterprise'
                    ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-white/10 text-white/60 border border-white/10'
                )}>
                  {profile?.plan === 'pro' ? '👑 Pro' : 
                   profile?.plan === 'enterprise' ? '🏢 Enterprise' : 
                   '⚡ Free'}
                </span>
              </div>
              <p className="text-sm text-white/50">
                {profile?.plan === 'free' 
                  ? 'Upgrade na Pro pro větší úložiště a více funkcí.'
                  : 'Díky za podporu! Užívejte si všechny funkce.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Formats Tab */}
        {activeTab === 'formats' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-white">Podporované formáty</span>
                <span className="text-sm text-white/50">{formatCounts.total} formátů</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-500/25">
                      S
                    </div>
                    <span className="font-medium text-white">Sklik</span>
                  </div>
                  <p className="text-sm text-white/50">{formatCounts.sklik} formátů</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/25">
                      G
                    </div>
                    <span className="font-medium text-white">Google Ads</span>
                  </div>
                  <p className="text-sm text-white/50">{formatCounts.google} formátů</p>
                </div>
              </div>
            </div>

            {/* Format Sources */}
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => setShowFormatSources(!showFormatSources)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Zdroje specifikací
                </span>
                {showFormatSources ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {showFormatSources && (
                <div className="px-4 pb-4 space-y-1 border-t border-white/10 pt-3">
                  {formatSourcesArray.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{source.name}</span>
                    </a>
                  ))}
                  <p className="text-xs text-white/30 mt-3 px-3">
                    Poslední aktualizace: {PRESET_SOURCES.lastUpdated}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)} 
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Zavřít
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
          >
            Uložit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
