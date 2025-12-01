import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms } from '@/lib/platforms'
import { 
  exportFormatsToCSV, 
  exportFormatsToJSON, 
  exportToGoogleAdsEditor, 
  exportToSklik,
  downloadText
} from '@/lib/export'
import { Button, Badge } from '@/components/ui'
import { Download, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormatSummaryBarProps {
  className?: string
}

export function FormatSummaryBar({ className }: FormatSummaryBarProps) {
  const { platform, category, selectedFormats } = useAppStore()
  const [exportOpen, setExportOpen] = useState(false)

  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform.categories[category]

  const handleExport = (type: 'csv' | 'json' | 'google' | 'sklik') => {
    if (selectedFormats.size === 0) {
      alert('Nejprve vyberte alespoň jeden formát')
      return
    }

    let content: string
    let filename: string
    let mimeType: string

    switch (type) {
      case 'csv':
        content = exportFormatsToCSV(selectedFormats)
        filename = `formaty_${platform}_${category}.csv`
        mimeType = 'text/csv'
        break
      case 'json':
        content = exportFormatsToJSON(selectedFormats)
        filename = `formaty_${platform}_${category}.json`
        mimeType = 'application/json'
        break
      case 'google':
        content = exportToGoogleAdsEditor(selectedFormats, 'MyCampaign')
        filename = `google_ads_editor_import.csv`
        mimeType = 'text/csv'
        break
      case 'sklik':
        content = exportToSklik(selectedFormats, 'MojeSkupina')
        filename = `sklik_import.csv`
        mimeType = 'text/csv'
        break
    }

    downloadText(content, filename, mimeType)
    setExportOpen(false)
  }

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-muted/50 border border-border', className)}>
      {/* Summary info */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span 
          className="font-semibold"
          style={{ color: currentPlatform.color }}
        >
          {currentPlatform.icon} {currentPlatform.name}
        </span>
        <span className="text-muted-foreground">–</span>
        <span className="font-medium">{currentCategory.name}</span>
        <span className="text-muted-foreground hidden sm:inline">•</span>
        <span className="text-muted-foreground">
          max <strong className="text-foreground">{currentCategory.maxSizeKB} kB</strong>
        </span>
        <span className="text-muted-foreground hidden sm:inline">•</span>
        <span className="text-muted-foreground hidden md:inline">
          {currentCategory.fileTypes.join(', ')}
        </span>
        {currentCategory.isHTML5 && <Badge variant="secondary" className="text-xs">HTML5</Badge>}
        {currentCategory.isPMax && <Badge variant="secondary" className="text-xs">P-Max</Badge>}
      </div>

      {/* Export dropdown */}
      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setExportOpen(!exportOpen)}
          className="gap-2"
          disabled={selectedFormats.size === 0}
        >
          <Download className="w-4 h-4" />
          Export ({selectedFormats.size})
          <ChevronDown className={cn('w-4 h-4 transition-transform', exportOpen && 'rotate-180')} />
        </Button>

        {exportOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setExportOpen(false)} 
            />
            <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 py-1">Exportovat vybrané formáty</p>
                
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                  <span>CSV (univerzální)</span>
                </button>
                
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                >
                  <FileJson className="w-4 h-4 text-blue-500" />
                  <span>JSON</span>
                </button>

                <div className="border-t border-border my-2" />
                <p className="text-xs text-muted-foreground px-2 py-1">Import pro platformy</p>

                <button
                  onClick={() => handleExport('google')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-lg">🌐</span>
                  <span>Google Ads Editor</span>
                </button>
                
                <button
                  onClick={() => handleExport('sklik')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-lg">🇨🇿</span>
                  <span>Sklik import</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
