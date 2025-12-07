import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { 
  sklikCategories, 
  googleCategories, 
  getRecommendedFormats,
  allFormats 
} from '@/lib/formats'
import type { Format, FormatCategory } from '@/types'
import { 
  ArrowRight, 
  Check, 
  Star,
  Image as ImageIcon,
  Code,
  Film
} from 'lucide-react'

export function FormatsPanel() {
  const {
    sourceImage,
    activePlatform,
    setActivePlatform,
    selectedFormats,
    toggleFormat,
    selectAllFormats,
    deselectAllFormats,
    setActiveTab,
  } = useAppStore()

  const getVisibleCategories = (): FormatCategory[] => {
    if (activePlatform === 'sklik') return sklikCategories
    if (activePlatform === 'google') return googleCategories
    return [...sklikCategories, ...googleCategories]
  }

  const selectRecommended = () => {
    const recommended = getRecommendedFormats(
      activePlatform === 'all' ? undefined : activePlatform
    )
    selectAllFormats(recommended.map(f => f.id))
  }

  const selectAllInCategory = (category: FormatCategory) => {
    selectAllFormats(category.formats.map(f => f.id))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-3 w-3" />
      case 'html5': return <Code className="h-3 w-3" />
      case 'video': return <Film className="h-3 w-3" />
      default: return null
    }
  }

  const selectedCount = selectedFormats.size
  const selectedSklik = Array.from(selectedFormats).filter(id => id.startsWith('sklik')).length
  const selectedGoogle = Array.from(selectedFormats).filter(id => id.startsWith('google')).length

  if (!sourceImage) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nejdřív nahraj obrázek</h2>
        <p className="text-muted-foreground mb-4">
          Potřebujeme zdrojový obrázek pro vytvoření kreativ
        </p>
        <Button onClick={() => setActiveTab('input')}>
          Zpět na vstup
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formáty</h1>
          <p className="text-muted-foreground">
            Vyber formáty pro export kreativ
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Sklik: {selectedSklik}</Badge>
            <Badge variant="outline">Google: {selectedGoogle}</Badge>
            <Badge variant="default">Celkem: {selectedCount}</Badge>
          </div>
          <Button
            onClick={() => setActiveTab('editor')}
            disabled={selectedCount === 0}
          >
            Pokračovat
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs 
        value={activePlatform} 
        onValueChange={(v) => setActivePlatform(v as any)}
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Vše</TabsTrigger>
            <TabsTrigger value="sklik">
              Sklik
              {selectedSklik > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {selectedSklik}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="google">
              Google Ads
              {selectedGoogle > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {selectedGoogle}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectRecommended}>
              <Star className="h-4 w-4 mr-2" />
              Doporučené
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllFormats}>
              Zrušit vše
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {getVisibleCategories().map((category) => (
            <Card key={`${category.platform}-${category.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {category.name}
                    </CardTitle>
                    <Badge variant={category.platform === 'sklik' ? 'warning' : 'default'}>
                      {category.platform === 'sklik' ? 'Sklik' : 'Google'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllInCategory(category)}
                  >
                    Vybrat vše
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {category.formats.map((format) => {
                    const isSelected = selectedFormats.has(format.id)
                    return (
                      <button
                        key={format.id}
                        onClick={() => toggleFormat(format.id)}
                        className={cn(
                          'relative p-3 rounded-lg border-2 text-left transition-all',
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                        )}
                      >
                        {/* Preview */}
                        <div 
                          className="w-full bg-muted rounded mb-2 flex items-center justify-center overflow-hidden"
                          style={{ 
                            aspectRatio: `${format.width}/${format.height}`,
                            maxHeight: '80px'
                          }}
                        >
                          {sourceImage && (
                            <img 
                              src={sourceImage} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium truncate">
                            {format.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getTypeIcon(format.type)}
                            <span>{format.width}×{format.height}</span>
                          </div>
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}

                        {/* Recommended badge */}
                        {format.recommended && (
                          <div className="absolute top-2 left-2">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Tabs>
    </div>
  )
}
