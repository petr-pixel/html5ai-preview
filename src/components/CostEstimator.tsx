import { useAppStore } from '@/stores/app-store'
import { Card } from '@/components/ui'
import { DollarSign, Image, Type, Film } from 'lucide-react'
import { PRICING, getImageModel, getTextModel, getVideoModel } from '@/lib/openai-client'

export function CostEstimator() {
  const {
    selectedFormats,
    textModelTier,
    imageModelTier,
    videoModelTier,
    videoScenario,
    textOverlay,
  } = useAppStore()

  // Odhady
  const imageCount = selectedFormats.size > 0 ? 1 : 0 // 1 zdrojový obrázek
  const variantCount = 1 // Pro MVP jen 1 varianta, později 3-5
  const imageQuality = getImageModel(imageModelTier).quality
  const imageCostPerUnit = PRICING.images['1024x1024'][imageQuality]
  const totalImageCost = imageCount * variantCount * imageCostPerUnit

  // Text - odhad tokenů pro headline + subheadline
  const textTokens = textOverlay.enabled ? 200 : 0 // ~200 tokenů pro generování textů
  const textModel = getTextModel(textModelTier) as keyof typeof PRICING.text
  const textPricing = PRICING.text[textModel]
  const totalTextCost = textTokens > 0 ? (textTokens * (textPricing.input + textPricing.output)) / 1_000_000 : 0

  // Video
  const videoModel = getVideoModel(videoModelTier)
  const videoCostPerSec = PRICING.video[videoModel]
  const totalVideoCost = videoScenario.lengthSeconds * videoCostPerSec

  // Celkem
  const totalCost = totalImageCost + totalTextCost + totalVideoCost

  if (totalCost === 0) return null

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-emerald-500" />
        <span className="text-sm font-semibold">Odhad nákladů</span>
      </div>

      <div className="space-y-2 text-xs">
        {totalImageCost > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Image className="w-3 h-3" />
              <span>Obrázky ({variantCount}× {imageQuality})</span>
            </div>
            <span className="font-medium">${totalImageCost.toFixed(3)}</span>
          </div>
        )}

        {totalTextCost > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Type className="w-3 h-3" />
              <span>Texty ({textModel})</span>
            </div>
            <span className="font-medium">${totalTextCost.toFixed(4)}</span>
          </div>
        )}

        {totalVideoCost > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Film className="w-3 h-3" />
              <span>Video ({videoScenario.lengthSeconds}s, {videoModel})</span>
            </div>
            <span className="font-medium">${totalVideoCost.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
          <span className="font-semibold">Celkem</span>
          <span className="font-bold text-emerald-500 text-sm">${totalCost.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        * Orientační odhad. Skutečná cena závisí na počtu API volání a délce generování.
      </p>
    </Card>
  )
}
