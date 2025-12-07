import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Settings, 
  Sun, 
  Moon, 
  Key, 
  Palette,
  Save,
  FolderOpen,
  Sparkles
} from 'lucide-react'

export function Header() {
  const { 
    apiKey, 
    setApiKey, 
    darkMode, 
    setDarkMode,
    projectName,
    sourceImage,
    selectedFormats,
    brandKit,
    setBrandKit,
  } = useAppStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)

  const saveApiKey = () => {
    setApiKey(tempApiKey)
    setSettingsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">AdCreative Studio</span>
          <Badge variant="secondary" className="text-xs">PRO</Badge>
        </div>

        {/* Project Name */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">{projectName}</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {sourceImage && (
            <Badge variant="outline" className="text-xs">
              Obrázek ✓
            </Badge>
          )}
          {selectedFormats.size > 0 && (
            <Badge variant="outline" className="text-xs">
              {selectedFormats.size} formátů
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Brand Kit */}
          <Dialog open={brandOpen} onOpenChange={setBrandOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Palette className="h-4 w-4 mr-2" />
                Brand Kit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Brand Kit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Primární barva</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={brandKit.primaryColor}
                        onChange={(e) => setBrandKit({ primaryColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={brandKit.primaryColor}
                        onChange={(e) => setBrandKit({ primaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sekundární barva</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={brandKit.secondaryColor}
                        onChange={(e) => setBrandKit({ secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={brandKit.secondaryColor}
                        onChange={(e) => setBrandKit({ secondaryColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Akcentová barva</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={brandKit.accentColor}
                        onChange={(e) => setBrandKit({ accentColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={brandKit.accentColor}
                        onChange={(e) => setBrandKit({ accentColor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Barva textu</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={brandKit.textColor}
                        onChange={(e) => setBrandKit({ textColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={brandKit.textColor}
                        onChange={(e) => setBrandKit({ textColor: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {brandKit.logo && (
                  <div>
                    <label className="text-sm font-medium">Logo</label>
                    <div className="mt-1 p-4 border rounded-lg flex items-center justify-center bg-muted">
                      <img src={brandKit.logo} alt="Logo" className="max-h-16" />
                    </div>
                  </div>
                )}
                <Button onClick={() => setBrandOpen(false)} className="w-full">
                  Uložit
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dark Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Settings */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nastavení</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    OpenAI API klíč
                  </label>
                  <Input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Získej na{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      platform.openai.com
                    </a>
                  </p>
                </div>
                <Button onClick={saveApiKey} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Uložit
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* API Status */}
          <Badge variant={apiKey ? 'success' : 'destructive'}>
            {apiKey ? 'API ✓' : 'Bez API'}
          </Badge>
        </div>
      </div>
    </header>
  )
}
