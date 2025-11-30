import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { testApiKey } from '@/lib/openai-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@/components/ui'
import { Key, Bot, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { apiKeys, setApiKeys } = useAppStore()
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue to-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-gray-900">API Nastavení</DialogTitle>
              <p className="text-sm text-gray-500">Zadejte svůj OpenAI API klíč</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
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
              Jeden klíč pro DALL-E 3 (obrázky), GPT-4o (texty) a Sora (video).
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
                <span className="font-medium">DALL-E 3 HD:</span> $0.08/obrázek
              </div>
              <div>
                <span className="font-medium">GPT-4o:</span> $2.50/1M tokenů
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

        <div className="flex gap-3 mt-6">
          <Button 
            variant="secondary" 
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700" 
            onClick={() => onOpenChange(false)}
          >
            Zrušit
          </Button>
          <Button 
            className="flex-1 bg-google-blue hover:bg-blue-700 text-white" 
            onClick={handleSave}
          >
            Uložit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
