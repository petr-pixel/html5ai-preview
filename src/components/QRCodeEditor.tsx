import { useAppStore } from '@/stores/app-store'
import { Input, Switch } from '@/components/ui'
import { QrCode } from 'lucide-react'

export function QRCodeEditor() {
  const { qrCode, setQRCode } = useAppStore()

  const positions = [
    { value: 'top-left', label: 'Vlevo nahoře' },
    { value: 'top-right', label: 'Vpravo nahoře' },
    { value: 'bottom-left', label: 'Vlevo dole' },
    { value: 'bottom-right', label: 'Vpravo dole' },
  ] as const

  return (
    <div className="bg-secondary rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">QR kód</span>
        </div>
        <Switch
          checked={qrCode.enabled}
          onCheckedChange={(checked) => setQRCode({ enabled: checked })}
        />
      </div>

      {qrCode.enabled && (
        <div className="space-y-4 animate-fade-in">
          {/* URL */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">URL adresa</label>
            <Input
              value={qrCode.url}
              onChange={(e) => setQRCode({ url: e.target.value })}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Pozice</label>
            <select
              value={qrCode.position}
              onChange={(e) => setQRCode({ position: e.target.value as typeof qrCode.position })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
            >
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          {/* Size & Margin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Velikost: {qrCode.size}px
              </label>
              <input
                type="range"
                min="40"
                max="200"
                step="10"
                value={qrCode.size}
                onChange={(e) => setQRCode({ size: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Okraj: {qrCode.margin}px
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={qrCode.margin}
                onChange={(e) => setQRCode({ margin: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
