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
  HardDrive,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
      <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue to-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-gray-900">Nastavení</DialogTitle>
              <p className="text-sm text-gray-500">API klíče a konfigurace</p>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('api')}
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'api'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Key className="w-4 h-4 inline mr-2" />
            API
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'storage'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Storage
          </button>
          <button
            onClick={() => setActiveTab('formats')}
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'formats'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Formáty
          </button>
        </div>

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            {/* OpenAI API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Bot className="w-4 h-4 text-green-600" />
                OpenAI API klíč
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({ openai: e.target.value })}
                  placeholder="sk-..."
                  className="flex-1"
                />
                {apiKeys.openai && (
                  <button
                    onClick={() => setApiKeys({ openai: '' })}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Jeden klíč pro GPT-4o (obrázky i texty) a Sora (video).
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testStatus === 'testing' || !apiKeys.openai}
                className="w-full mt-2"
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testování...
                  </>
                ) : (
                  'Otestovat připojení'
                )}
              </Button>

              {testStatus !== 'idle' && testStatus !== 'testing' && (
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                  testStatus === 'success' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                )}>
                  {testStatus === 'success' 
                    ? <CheckCircle className="w-4 h-4" />
                    : <XCircle className="w-4 h-4" />
                  }
                  {testMessage}
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="p-4 bg-blue-50 rounded-xl space-y-2">
              <p className="text-sm font-medium text-blue-900">Kde získat API klíč?</p>
              <p className="text-sm text-blue-700">
                Přejděte na{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  platform.openai.com/api-keys
                </a>
                {' '}a vytvořte nový klíč. Doporučujeme nastavit spending limit.
              </p>
            </div>

            {/* Pricing Info */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-900 mb-2">Orientační ceny</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">GPT-4o obrázky:</span> $0.01-0.17
                </div>
                <div>
                  <span className="font-medium">GPT-4o texty:</span> $2.50/1M tokenů
                </div>
                <div>
                  <span className="font-medium">Slideshow:</span> zdarma (lokální)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="space-y-4">
            {/* Supabase Storage Info */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Supabase Storage</p>
                  <p className="text-sm text-gray-500">Cloud úložiště pro vaše kreativy</p>
                </div>
              </div>

              {/* Usage bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Využité místo</span>
                  <span className="font-medium text-gray-900">
                    {formatStorageSize(storageUsed)} / {formatStorageSize(storageLimit)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      storagePercent > 90 ? 'bg-red-500' :
                      storagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    )}
                    style={{ width: `${Math.min(100, storagePercent)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {storagePercent}% využito · Zbývá {formatStorageSize(storageLimit - storageUsed)}
                </p>
              </div>
            </div>

            {/* Plan Info */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-900 mb-2">Váš plán: {profile?.plan || 'Free'}</p>
              <p className="text-sm text-blue-700">
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
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Podporované formáty</span>
                <span className="text-sm text-gray-500">{formatCounts.total} formátů</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white text-xs font-bold">S</div>
                    <span className="font-medium text-gray-900">Sklik</span>
                  </div>
                  <p className="text-sm text-gray-500">{formatCounts.sklik} formátů</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">G</div>
                    <span className="font-medium text-gray-900">Google Ads</span>
                  </div>
                  <p className="text-sm text-gray-500">{formatCounts.google} formátů</p>
                </div>
              </div>
            </div>

            {/* Format Sources */}
            <div>
              <button
                onClick={() => setShowFormatSources(!showFormatSources)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {showFormatSources ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Zdroje specifikací
              </button>
              
              {showFormatSources && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                  {PRESET_SOURCES.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {source.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Zavřít
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-google-blue to-blue-600 text-white">
            Uložit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
