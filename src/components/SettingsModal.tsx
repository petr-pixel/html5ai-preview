import { useAppStore } from '@/stores/app-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@/components/ui'
import { Key, Bot } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { apiKeys, setApiKeys } = useAppStore()

  const apiProviders = [
    {
      key: 'openai' as const,
      label: 'OpenAI API',
      placeholder: 'sk-...',
      description: 'Jeden klíč pro text, obrázky i video.',
      icon: Bot,
      color: 'text-green-400',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>API Nastavení</DialogTitle>
              <p className="text-sm text-muted-foreground">Zadejte své API klíče</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {apiProviders.map((provider) => (
            <div key={provider.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <provider.icon className={`w-4 h-4 ${provider.color}`} />
                {provider.label}
              </label>
              <Input
                type="password"
                placeholder={provider.placeholder}
                value={apiKeys[provider.key]}
                onChange={(e) => setApiKeys({ [provider.key]: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{provider.description}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Uložit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
