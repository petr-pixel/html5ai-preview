/**
 * MagicResize - Jedno tlačítko pro všechny formáty
 * 
 * Funkce:
 * - Detekce zdrojového obrázku
 * - Automatický výběr optimální metody (crop/outpaint/scale)
 * - Paralelní zpracování všech formátů
 * - Progress tracking
 * - Smart rozhodování kdy outpaintovat
 */

import { useState, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms, getFormatKey } from '@/lib/platforms'
import { calculateSmartCrop, applyCrop } from '@/lib/smart-crop'
import { outpaintImage } from '@/lib/openai-client'
import { Button, Progress, Badge } from '@/components/ui'
import { CostBadge, calculateCost, formatPrice } from '@/components/CostEstimate'
import { cn } from '@/lib/utils'
import {
  Wand2,
  Sparkles,
  Loader2,
  Check,
  X,
  Image as ImageIcon,
  Crop,
  Expand,
  Scale,
  AlertTriangle,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye
} from 'lucide-react'
import type { Format, Creative } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface FormatTask {
  key: string
  format: Format
  platform: string
  category: string
  status: 'pending' | 'processing' | 'done' | 'error' | 'skipped'
  method?: 'crop' | 'outpaint' | 'scale' | 'fit'
  result?: string // data URL
  error?: string
}

interface MagicResizeProps {
  onComplete?: (creatives: Creative[]) => void
  onClose?: () => void
}

// =============================================================================
// RESIZE LOGIC
// =============================================================================

/**
 * Rozhodne jakou metodu použít pro daný formát
 */
function decideMethod(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): 'crop' | 'outpaint' | 'scale' | 'fit' {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight
  const ratioDiff = Math.abs(sourceRatio - targetRatio)

  // Pokud je rozdíl poměrů malý, stačí crop
  if (ratioDiff < 0.3) {
    return 'crop'
  }

  // Pokud je zdrojový obrázek výrazně jiný, outpaint
  if (ratioDiff > 0.5) {
    return 'outpaint'
  }

  // Pokud je cílový formát menší, scale down
  if (targetWidth < sourceWidth * 0.5 && targetHeight < sourceHeight * 0.5) {
    return 'scale'
  }

  // Jinak fit (letterbox style)
  return 'fit'
}

/**
 * Zpracuje jeden formát
 */
async function processFormat(
  task: FormatTask,
  sourceImage: string,
  sourceWidth: number,
  sourceHeight: number,
  apiKey?: string,
  textOverlay?: any
): Promise<FormatTask> {
  const { format } = task

  try {
    const method = decideMethod(sourceWidth, sourceHeight, format.width, format.height)
    task.method = method

    if (method === 'crop') {
      // Smart crop
      const cropResult = await calculateSmartCrop(sourceImage, format.width, format.height)
      const croppedImage = await applyCrop(sourceImage, cropResult, format.width, format.height)
      task.result = croppedImage
      task.status = 'done'
    }
    else if (method === 'outpaint' && apiKey) {
      // AI outpainting
      const result = await outpaintImage(
        { apiKey },
        {
          image: sourceImage,
          targetWidth: format.width,
          targetHeight: format.height,
          prompt: 'Continue the background seamlessly, matching style and lighting',
        }
      )
      if (result.success && result.image) {
        task.result = result.image
        task.status = 'done'
      } else {
        // Fallback to fit
        task.result = await fitImage(sourceImage, format.width, format.height)
        task.status = 'done'
        task.method = 'fit'
      }
    }
    else if (method === 'scale' || method === 'fit' || !apiKey) {
      // Simple fit/scale
      task.result = await fitImage(sourceImage, format.width, format.height)
      task.status = 'done'
      task.method = 'fit'
    }
  } catch (error: any) {
    task.status = 'error'
    task.error = error.message || 'Zpracování selhalo'
  }

  return task
}

/**
 * Fit obrázek do formátu s rozmazaným pozadím
 */
async function fitImage(sourceImage: string, targetWidth: number, targetHeight: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')!

      // Blur background
      ctx.filter = 'blur(30px) saturate(1.1)'
      ctx.drawImage(img, -30, -30, targetWidth + 60, targetHeight + 60)
      ctx.filter = 'none'

      // Gradient overlay
      const gradient = ctx.createRadialGradient(
        targetWidth / 2, targetHeight / 2, 0,
        targetWidth / 2, targetHeight / 2, Math.max(targetWidth, targetHeight) / 1.5
      )
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.2)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      // Calculate fit dimensions
      const srcRatio = img.width / img.height
      const tgtRatio = targetWidth / targetHeight
      let drawWidth, drawHeight, drawX, drawY

      if (srcRatio > tgtRatio) {
        drawWidth = targetWidth
        drawHeight = targetWidth / srcRatio
        drawX = 0
        drawY = (targetHeight - drawHeight) / 2
      } else {
        drawHeight = targetHeight
        drawWidth = targetHeight * srcRatio
        drawX = (targetWidth - drawWidth) / 2
        drawY = 0
      }

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 20
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      ctx.shadowBlur = 0

      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => resolve(sourceImage)
    img.src = sourceImage
  })
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MagicResize({ onComplete, onClose }: MagicResizeProps) {
  const {
    sourceImage,
    selectedFormats,
    apiKeys,
    textOverlay,
    platform,
    category,
    addCreatives
  } = useAppStore()

  const [tasks, setTasks] = useState<FormatTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sourceSize, setSourceSize] = useState<{ width: number; height: number } | null>(null)
  const [showPreview, setShowPreview] = useState<string | null>(null)

  // Initialize tasks from selected formats
  const initializeTasks = useCallback(() => {
    const newTasks: FormatTask[] = []

    for (const formatKey of selectedFormats) {
      const [platformId, categoryId, indexStr] = formatKey.split('-')
      const index = parseInt(indexStr)
      const p = platforms[platformId]
      const c = p?.categories[categoryId]
      const format = c?.formats[index]

      if (format && c.type === 'image') {
        newTasks.push({
          key: formatKey,
          format,
          platform: platformId,
          category: categoryId,
          status: 'pending',
        })
      }
    }

    setTasks(newTasks)
    return newTasks
  }, [selectedFormats])

  // Get source image dimensions
  const loadSourceSize = useCallback(() => {
    if (!sourceImage) return

    const img = new Image()
    img.onload = () => {
      setSourceSize({ width: img.width, height: img.height })
    }
    img.src = sourceImage
  }, [sourceImage])

  // Start processing
  const startProcessing = async () => {
    if (!sourceImage || !sourceSize) return

    const currentTasks = tasks.length > 0 ? tasks : initializeTasks()
    if (currentTasks.length === 0) {
      initializeTasks()
      loadSourceSize()
      return
    }

    setIsProcessing(true)
    setIsPaused(false)
    setProgress(0)

    const total = currentTasks.length
    let completed = 0

    // Process in parallel batches of 3
    const batchSize = 3
    const pendingTasks = currentTasks.filter(t => t.status === 'pending' || t.status === 'error')

    for (let i = 0; i < pendingTasks.length; i += batchSize) {
      if (isPaused) break

      const batch = pendingTasks.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(task =>
          processFormat(
            { ...task, status: 'processing' },
            sourceImage,
            sourceSize.width,
            sourceSize.height,
            apiKeys.openai,
            textOverlay
          )
        )
      )

      // Update tasks
      setTasks(prev => {
        const updated = [...prev]
        for (const result of results) {
          const idx = updated.findIndex(t => t.key === result.key)
          if (idx >= 0) {
            updated[idx] = result
          }
        }
        return updated
      })

      completed += batch.length
      setProgress(Math.round((completed / total) * 100))
    }

    setIsProcessing(false)
  }

  // Save all results
  const saveResults = () => {
    const doneTasks = tasks.filter(t => t.status === 'done' && t.result)
    const creatives: Creative[] = doneTasks.map(task => ({
      id: `${task.key}-${Date.now()}`,
      formatKey: task.key,
      platform: task.platform as any,
      category: task.category,
      format: task.format,
      imageUrl: task.result!,
      createdAt: new Date(),
    }))

    addCreatives(creatives)
    onComplete?.(creatives)
    onClose?.()
  }

  // Reset
  const reset = () => {
    setTasks([])
    setProgress(0)
    setIsProcessing(false)
    setIsPaused(false)
  }

  // Initialize on mount
  useState(() => {
    loadSourceSize()
    initializeTasks()
  })

  const completedCount = tasks.filter(t => t.status === 'done').length
  const errorCount = tasks.filter(t => t.status === 'error').length
  const methodCounts = {
    crop: tasks.filter(t => t.method === 'crop').length,
    outpaint: tasks.filter(t => t.method === 'outpaint').length,
    fit: tasks.filter(t => t.method === 'fit' || t.method === 'scale').length,
  }

  return (
    <div className="bg-[#0F1115]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-lg shadow-pink-500/20">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Magic Resize</h3>
              <p className="text-sm text-white/50">Všechny formáty jedním klikem</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/10">×</Button>
          )}
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* Source info */}
        {sourceImage && sourceSize && (
          <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg mb-6">
            <img
              src={sourceImage}
              alt="Source"
              className="w-20 h-20 object-cover rounded-lg border border-white/10"
            />
            <div className="flex-1">
              <p className="font-medium text-white">Zdrojový obrázek</p>
              <p className="text-sm text-white/50">{sourceSize.width} × {sourceSize.height}px</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="border-white/10 text-white/60">{tasks.length} formátů</Badge>
                {apiKeys.openai && <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-300">AI Outpainting</Badge>}
              </div>
            </div>
          </div>
        )}

        {!sourceImage && (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
            <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Nejprve nahrajte zdrojový obrázek</p>
          </div>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Zpracovávám formáty...</span>
              <span className="text-sm text-white/50">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                {isPaused ? 'Pokračovat' : 'Pozastavit'}
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        {tasks.length > 0 && !isProcessing && completedCount > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
              <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-emerald-400">{completedCount}</div>
              <div className="text-xs text-emerald-500/70">Hotovo</div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <Crop className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-400">{methodCounts.crop}</div>
              <div className="text-xs text-blue-500/70">Smart Crop</div>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
              <Expand className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-400">{methodCounts.outpaint}</div>
              <div className="text-xs text-purple-500/70">AI Outpaint</div>
            </div>
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
              <Scale className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-orange-400">{methodCounts.fit}</div>
              <div className="text-xs text-orange-500/70">Fit/Scale</div>
            </div>
          </div>
        )}

        {/* Task list */}
        {tasks.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.key}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  task.status === 'done' && "bg-emerald-500/10 border-emerald-500/20",
                  task.status === 'error' && "bg-red-500/10 border-red-500/20",
                  task.status === 'processing' && "bg-blue-500/10 border-blue-500/20",
                  task.status === 'pending' && "bg-white/5 border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  {task.status === 'done' && <Check className="w-4 h-4 text-emerald-500" />}
                  {task.status === 'error' && <X className="w-4 h-4 text-red-500" />}
                  {task.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {task.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-white/20" />}

                  <div>
                    <p className="text-sm font-medium text-white">
                      {task.format.name}
                    </p>
                    <p className="text-xs text-white/50">
                      {task.format.width}×{task.format.height} • {task.platform}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.method && (
                    <Badge variant="outline" className="text-xs border-white/10 text-white/60">
                      {task.method === 'crop' && <Crop className="w-3 h-3 mr-1" />}
                      {task.method === 'outpaint' && <Expand className="w-3 h-3 mr-1" />}
                      {task.method === 'fit' && <Scale className="w-3 h-3 mr-1" />}
                      {task.method}
                    </Badge>
                  )}

                  {task.status === 'done' && task.result && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(showPreview === task.key ? null : task.key)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(null)}>
            <div className="bg-[#0F1115] border border-white/10 rounded-lg p-2 max-w-2xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <img
                src={tasks.find(t => t.key === showPreview)?.result}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between flex-shrink-0">
        <div>
          {errorCount > 0 && (
            <span className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {errorCount} chyb
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {completedCount > 0 && !isProcessing && (
            <>
              <Button variant="outline" onClick={reset} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={saveResults} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Uložit {completedCount} kreativ
              </Button>
            </>
          )}

          {!isProcessing && completedCount === 0 && sourceImage && tasks.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={startProcessing}
                className="bg-gradient-to-r from-pink-600 to-orange-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Spustit Magic Resize
                {methodCounts.outpaint > 0 && apiKeys.openai && (
                  <CostBadge cost={calculateCost('outpaint', { count: methodCounts.outpaint })} />
                )}
              </Button>
              {methodCounts.outpaint > 0 && apiKeys.openai && (
                <p className="text-xs text-amber-600">
                  ⚡ {methodCounts.outpaint} formátů použije AI outpainting
                </p>
              )}
            </div>
          )}

          {!sourceImage && (
            <Button disabled className="bg-white/5 text-white/40 border border-white/10">
              <ImageIcon className="w-4 h-4 mr-2" />
              Nejprve nahrajte obrázek
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MagicResize
