'use client'

import { useAppStore } from '@/stores/app-store'
import { Button, Card, Tabs, Badge } from '@/components/ui'
import { platforms, getRecommendedFormats } from '@/lib/formats'
import type { PlatformId, Format, Category } from '@/types'
import { Check, Star, Monitor, Smartphone, Film } from 'lucide-react'

export function FormatSelector() {
  const {
    activePlatform,
    setActivePlatform,
    selectedFormats,
    toggleFormat,
    selectRecommended,
    clearSelection,
    setActiveTab,
    sourceImage,
  } = useAppStore()

  const platformTabs = [
    { id: 'all', label: 'Vše', icon: <Monitor className="w-4 h-4" /> },
    { id: 'sklik', label: 'Sklik', icon: <span className="text-lg">🟠</span> },
    { id: 'google', label: 'Google Ads', icon: <span className="text-lg">🔵</span> },
  ]

  const getVisiblePlatforms = (): PlatformId[] => {
    if (activePlatform === 'all') return ['sklik', 'google']
    return [activePlatform as PlatformId]
  }

  const getFormatIcon = (format: Format) => {
    if (format.type === 'video') return <Film className="w-4 h-4" />
    if (format.width < 400) return <Smartphone className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  const isSelected = (formatId: string) => selectedFormats.has(formatId)

  const getCategoryFormatCount = (category: Category) => {
    return category.formats.filter(f => isSelected(f.id)).length
  }

  return (
    <div className="space-y-6">
      {/* Platform Tabs */}
      <div className="flex items-center justify-between">
        <Tabs
          tabs={platformTabs}
          activeTab={activePlatform}
          onChange={(id) => setActivePlatform(id as PlatformId | 'all')}
        />

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectRecommended}>
            <Star className="w-4 h-4 mr-1" />
            Doporučené
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Zrušit výběr
          </Button>
        </div>
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg">
        <span className="text-sm text-primary-700">
          Vybráno: <strong>{selectedFormats.size}</strong> formátů
        </span>
        {selectedFormats.size > 0 && (
          <Button size="sm" onClick={() => setActiveTab('editor')}>
            Pokračovat k editoru
          </Button>
        )}
      </div>

      {/* Format Grid */}
      {getVisiblePlatforms().map((platformId) => {
        const platform = platforms[platformId]
        return (
          <div key={platformId} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {platform.icon} {platform.name}
            </h3>

            {Object.values(platform.categories).map((category) => (
              <Card key={category.id} padding="sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <h4 className="font-medium">{category.name}</h4>
                    {getCategoryFormatCount(category) > 0 && (
                      <Badge variant="success">
                        {getCategoryFormatCount(category)}/{category.formats.length}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allSelected = category.formats.every(f => isSelected(f.id))
                      category.formats.forEach(f => {
                        if (allSelected) {
                          if (isSelected(f.id)) toggleFormat(f.id)
                        } else {
                          if (!isSelected(f.id)) toggleFormat(f.id)
                        }
                      })
                    }}
                  >
                    {category.formats.every(f => isSelected(f.id)) ? 'Odznačit vše' : 'Vybrat vše'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {category.formats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => toggleFormat(format.id)}
                      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected(format.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected(format.id) && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      {format.isRecommended && (
                        <Star className="absolute top-1 left-1 w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}

                      {/* Preview box */}
                      <div className="relative mb-2 bg-gray-100 rounded overflow-hidden" style={{ paddingBottom: `${(format.height / format.width) * 100}%`, maxHeight: '60px' }}>
                        {sourceImage && (
                          <img
                            src={sourceImage}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-gray-400 bg-white/80 px-1 rounded">
                            {format.width}×{format.height}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {getFormatIcon(format)}
                        <span className="text-xs font-medium truncate">{format.name}</span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Max {format.maxSizeKB < 1024 ? `${format.maxSizeKB} kB` : `${(format.maxSizeKB / 1024).toFixed(0)} MB`}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )
      })}

      {/* Continue Button */}
      {selectedFormats.size > 0 && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => setActiveTab('editor')}
        >
          Pokračovat k editoru ({selectedFormats.size} formátů)
        </Button>
      )}
    </div>
  )
}
