import { useAppStore } from '@/stores/app-store'
import { Button, Card } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { platforms } from '@/lib/platforms'
import { History, Trash2, Clock, Image } from 'lucide-react'

export function HistoryPanel() {
  const { history, clearHistory, loadFromHistory, setActiveView } = useAppStore()

  const handleLoad = (item: typeof history[0]) => {
    loadFromHistory(item)
    setActiveView('create')
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Žádná historie</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Vaše vygenerované kreativy se zde budou ukládat pro pozdější použití
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historie generování</h2>
          <p className="text-sm text-muted-foreground">{history.length} projektů</p>
        </div>
        <Button variant="ghost" onClick={clearHistory} className="text-destructive">
          <Trash2 className="w-4 h-4" />
          Vymazat vše
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {history.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => handleLoad(item)}
          >
            {/* Preview */}
            <div className="aspect-video bg-muted relative overflow-hidden">
              {item.sourceImage ? (
                <img 
                  src={item.sourceImage} 
                  alt={item.prompt} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-medium">
                {item.creatives.length} kreativ
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="font-medium text-sm truncate mb-1">{item.prompt || 'Bez promptu'}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(new Date(item.createdAt))}
                </span>
                <span 
                  className="px-2 py-0.5 rounded"
                  style={{ 
                    background: `${platforms[item.platform].color}20`,
                    color: platforms[item.platform].color 
                  }}
                >
                  {platforms[item.platform].name}
                </span>
              </div>

              {/* Text overlay preview */}
              {item.textOverlay.enabled && item.textOverlay.headline && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground truncate">
                    "{item.textOverlay.headline}"
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
