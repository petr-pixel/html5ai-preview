import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { testApiKey } from '@/lib/openai-client'
import { PRESET_SOURCES, ALL_PRESETS } from '@/lib/format-presets'
import { getStorageStats, resetStorageStats, R2_STORAGE_LIMIT_GB, formatBytes } from '@/lib/r2-storage'
import type { R2StorageStats } from '@/lib/r2-storage'
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
  RefreshCw,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronRight,
  Cloud,
  HardDrive,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { apiKeys, setApiKeys, r2Config, setR2Config } = useAppStore()
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [showFormatSources, setShowFormatSources] = useState(false)
  const [activeTab, setActiveTab] = useState<'api' | 'storage' | 'formats'>('api')
  const [r2TestStatus, setR2TestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [storageStats, setStorageStats] = useState<R2StorageStats>(getStorageStats())

  // Refresh storage stats when tab changes
  useEffect(() => {
    if (activeTab === 'storage') {
      setStorageStats(getStorageStats())
    }
  }, [activeTab])

  const handleTest = async () => {
    if (!apiKeys.openai) {
      setTestStatus('error')
      setTestMessage('Zadejte API klíč')
      return
    }

    setTestStatus('testing')
    setTestMessage('Testuji připojení...')

    const result = await testApiKey(apiKeys.openai)

    if (result.valid) {
      setTestStatus('success')
      setTestMessage(result.error || 'API klíč je platný ✓')
    } else {
      setTestStatus('error')
      setTestMessage(result.error || 'Klíč je neplatný')
    }
  }

  const handleDelete = () => {
    setApiKeys({ openai: '' })
    setTestStatus('idle')
    setTestMessage('')
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
              <p className="text-sm text-gray-500">API klíče a konfigurace formátů</p>
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
            <Cloud className="w-4 h-4 inline mr-2" />
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
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Bot className="w-4 h-4 text-green-500" />
                OpenAI API klíč
              </label>
              
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKeys.openai}
                  onChange={(e) => {
                    setApiKeys({ openai: e.target.value })
                    setTestStatus('idle')
                  }}
                  className="flex-1 font-mono text-sm bg-white border-gray-300 text-gray-900"
                />
                
                {/* Delete button */}
                {apiKeys.openai && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Smazat klíč"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Jeden klíč pro GPT-4o (obrázky i texty) a Sora (video).
              </p>

              {/* Test button & status */}
              <div className="flex items-center gap-3 mt-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleTest}
                  disabled={testStatus === 'testing' || !apiKeys.openai}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {testStatus === 'testing' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Otestovat připojení
                </Button>

                {testStatus === 'success' && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {testMessage}
                  </span>
                )}
                
                {testStatus === 'error' && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle className="w-4 h-4" />
                    {testMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Info box */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                Kde získat API klíč?
              </h4>
              <p className="text-xs text-blue-700">
                Přejděte na{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  platform.openai.com/api-keys
                </a>
                {' '}a vytvořte nový klíč. Doporučujeme nastavit spending limit.
              </p>
            </div>

            {/* Pricing info */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Orientační ceny
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">GPT-4o obrázky:</span> $0.01-0.17
                </div>
                <div>
                  <span className="font-medium">GPT-4o texty:</span> $2.50/1M tokenů
                </div>
                <div>
                  <span className="font-medium">Sora:</span> od $0.10/sekunda
                </div>
                <div>
                  <span className="font-medium">Slideshow:</span> zdarma (lokální)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Tab - Cloudflare R2 */}
        {activeTab === 'storage' && (
          <div className="space-y-4">
            {/* Storage Usage - Progress Bar */}
            <div className={cn(
              'p-4 rounded-lg border',
              storageStats.isOverLimit 
                ? 'bg-red-50 border-red-200'
                : storageStats.isNearLimit
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className={cn(
                    'w-4 h-4',
                    storageStats.isOverLimit 
                      ? 'text-red-600'
                      : storageStats.isNearLimit
                        ? 'text-amber-600'
                        : 'text-gray-600'
                  )} />
                  <span className="text-sm font-medium">Využité místo</span>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  storageStats.isOverLimit 
                    ? 'text-red-700'
                    : storageStats.isNearLimit
                      ? 'text-amber-700'
                      : 'text-gray-700'
                )}>
                  {storageStats.usedGB} / {storageStats.limitGB} GB
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full transition-all',
                    storageStats.isOverLimit 
                      ? 'bg-red-500'
                      : storageStats.isNearLimit
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(storageStats.percentUsed, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-500">
                  {storageStats.percentUsed}% využito
                </span>
                <span className="text-gray-500">
                  Zbývá: {storageStats.remainingGB} GB
                </span>
              </div>
              
              {storageStats.isNearLimit && !storageStats.isOverLimit && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-700">
                  <AlertTriangle className="w-3 h-3" />
                  Blížíte se limitu! Zvažte smazání starých kreativ.
                </div>
              )}
              
              {storageStats.isOverLimit && (
                <div className="flex items-center gap-2 mt-2 text-xs text-red-700">
                  <AlertTriangle className="w-3 h-3" />
                  Limit překročen! Upload nových souborů je zablokován.
                </div>
              )}
              
              {/* Reset button */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Resetovat počítadlo? Použijte po ručním vyčištění bucketu v Cloudflare.')) {
                      resetStorageStats()
                      setStorageStats(getStorageStats())
                    }
                  }}
                  className="text-xs text-gray-500"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Resetovat počítadlo
                </Button>
              </div>
            </div>

            {/* R2 Status */}
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-3',
              r2Config?.accountId
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            )}>
              <Cloud className={cn(
                'w-5 h-5',
                r2Config?.accountId ? 'text-green-600' : 'text-gray-400'
              )} />
              <div className="flex-1">
                <div className={cn(
                  'text-sm font-medium',
                  r2Config?.accountId ? 'text-green-800' : 'text-gray-600'
                )}>
                  {r2Config?.accountId ? 'R2 nakonfigurováno' : 'R2 není nakonfigurováno'}
                </div>
                {r2Config?.bucketName && (
                  <div className="text-xs text-green-600">
                    Bucket: {r2Config.bucketName}
                  </div>
                )}
              </div>
              {r2Config?.accountId && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>

            {/* R2 Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account ID
                </label>
                <Input
                  value={r2Config?.accountId || ''}
                  onChange={(e) => setR2Config({ accountId: e.target.value })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Bucket Name
                </label>
                <Input
                  value={r2Config?.bucketName || ''}
                  onChange={(e) => setR2Config({ bucketName: e.target.value })}
                  placeholder="my-bucket"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Access Key ID
                </label>
                <Input
                  value={r2Config?.accessKeyId || ''}
                  onChange={(e) => setR2Config({ accessKeyId: e.target.value })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Secret Access Key
                </label>
                <Input
                  type="password"
                  value={r2Config?.secretAccessKey || ''}
                  onChange={(e) => setR2Config({ secretAccessKey: e.target.value })}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Public URL
                </label>
                <Input
                  value={r2Config?.publicUrl || ''}
                  onChange={(e) => setR2Config({ publicUrl: e.target.value })}
                  placeholder="https://xxx.r2.cloudflarestorage.com/bucket"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formát: https://[account-id].r2.cloudflarestorage.com/[bucket]
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-xs font-medium text-blue-800 mb-1">
                💡 Tip: Limit 9 GB
              </h4>
              <p className="text-xs text-blue-700">
                Držíme 1 GB rezervu pro jistotu. Cloudflare free tier má 10 GB.
                Po vyčištění bucketu v Cloudflare klikněte "Resetovat počítadlo".
              </p>
            </div>
          </div>
        )}

        {/* Formats Tab */}
        {activeTab === 'formats' && (
          <div className="space-y-4">
            {/* Format Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCounts.google}</div>
                <div className="text-xs text-blue-700">Google Ads</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{formatCounts.sklik}</div>
                <div className="text-xs text-orange-700">Sklik</div>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-700">{formatCounts.total}</div>
                <div className="text-xs text-gray-600">Celkem</div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div>
                <div className="text-sm font-medium text-green-800">
                  Formáty aktualizovány
                </div>
                <div className="text-xs text-green-600">
                  {PRESET_SOURCES.lastUpdated}
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>

            {/* Sources */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowFormatSources(!showFormatSources)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Zdroje specifikací</span>
                {showFormatSources ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {showFormatSources && (
                <div className="p-4 space-y-4 bg-white">
                  {/* Sklik Sources */}
                  <div>
                    <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-2">
                      🇨🇿 Sklik
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(PRESET_SOURCES.sklik).map(([key, url]) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 py-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="capitalize">{key}</span>
                          <span className="text-gray-400 truncate flex-1">{url}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Google Sources */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
                      🌐 Google Ads
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(PRESET_SOURCES.google).map(([key, url]) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 py-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="capitalize">{key}</span>
                          <span className="text-gray-400 truncate flex-1">{url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Update Instructions */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Jak aktualizovat formáty?
              </h4>
              <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                <li>Otevřete odkazy výše a zkontrolujte změny v dokumentaci</li>
                <li>Upravte soubor <code className="bg-amber-100 px-1 rounded">src/lib/format-presets.ts</code></li>
                <li>Aktualizujte příslušné presety a <code className="bg-amber-100 px-1 rounded">lastUpdated</code></li>
                <li>Rebuild aplikace</li>
              </ol>
              <p className="text-xs text-amber-600 mt-2">
                💡 Tip: Sklik má validátor na{' '}
                <a 
                  href="https://nastroje.prehledreklam.cz/cz/kontrola-html5-banneru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  nastroje.prehledreklam.cz
                </a>
              </p>
            </div>

            {/* Format Categories */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Dostupné kategorie
              </h4>
              <div className="flex flex-wrap gap-2">
                {['display', 'html5', 'pmax', 'demandgen', 'responsive', 'bannery', 'kombinovana', 'branding'].map(cat => (
                  <span
                    key={cat}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button 
            variant="secondary" 
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700" 
            onClick={() => onOpenChange(false)}
          >
            Zavřít
          </Button>
          {activeTab === 'api' && (
            <Button 
              className="flex-1 bg-google-blue hover:bg-blue-700 text-white" 
              onClick={handleSave}
            >
              Uložit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
