import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms } from '@/lib/platforms'
import { loadImage, generateId } from '@/lib/utils'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { COLORS } from '@/lib/design-tokens'
import { calculateCost, formatPrice } from '@/components/CostEstimate'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { PlatformId, Creative, Format } from '@/types'

interface MagicResizeModalProps {
  onClose: () => void
}

export function MagicResizeModal({ onClose }: MagicResizeModalProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(true)
  
  const { 
    sourceImage, selectedFormats, platform, addCreatives,
    isGenerating, setIsGenerating, progress, setProgress 
  } = useAppStore()
  
  const [tasks, setTasks] = useState<Array<{
    key: string;
    format: Format;
    status: 'pending' | 'processing' | 'done' | 'error';
    method: 'crop' | 'outpaint' | 'scale';
    result?: string;
  }>>([])
  
  const [srcRatio, setSrcRatio] = useState(1.5)
  
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  
  // Initialize tasks with real image ratio calculation
  useEffect(() => {
    if (!sourceImage) return
    
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      setSrcRatio(ratio)
      
      const newTasks: typeof tasks = []
      selectedFormats.forEach(formatKey => {
        const [plat, cat, idx] = formatKey.split('_')
        const fmt = platforms[plat as PlatformId]?.categories[cat]?.formats[parseInt(idx)]
        if (fmt) {
          const tgtRatio = fmt.width / fmt.height
          const diff = Math.abs(ratio - tgtRatio)
          const method = diff < 0.3 ? 'crop' : diff > 0.5 ? 'outpaint' : 'scale'
          
          newTasks.push({
            key: formatKey,
            format: fmt,
            status: 'pending',
            method,
          })
        }
      })
      setTasks(newTasks)
    }
    img.src = sourceImage
  }, [sourceImage, selectedFormats])
  
  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const errorCount = tasks.filter(t => t.status === 'error').length
  
  const totalEstimatedCost = useMemo(() => {
    return tasks.reduce((sum, task) => {
      if (task.method === 'crop') return sum
      if (task.method === 'scale') return sum + calculateCost('resize', { count: 1 })
      if (task.method === 'outpaint') return sum + calculateCost('outpaint', { count: 1 })
      return sum
    }, 0)
  }, [tasks])
  
  const handleStart = async () => {
    if (!sourceImage) return
    setIsGenerating(true)
    
    const img = await loadImage(sourceImage)
    const total = tasks.length
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      setTasks(prev => prev.map(t => t.key === task.key ? { ...t, status: 'processing' } : t))
      setProgress(Math.round(((i + 0.5) / total) * 100))
      
      try {
        const canvas = document.createElement('canvas')
        canvas.width = task.format.width
        canvas.height = task.format.height
        const ctx = canvas.getContext('2d')!
        
        const crop = await calculateSmartCrop(sourceImage, task.format.width, task.format.height)
        ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, task.format.width, task.format.height)
        
        const result = canvas.toDataURL('image/png')
        setTasks(prev => prev.map(t => t.key === task.key ? { ...t, status: 'done', result } : t))
      } catch (err) {
        setTasks(prev => prev.map(t => t.key === task.key ? { ...t, status: 'error' } : t))
      }
      
      setProgress(Math.round(((i + 1) / total) * 100))
    }
    
    setIsGenerating(false)
  }
  
  const handleSave = () => {
    const doneTasks = tasks.filter(t => t.status === 'done' && t.result)
    const creatives: Creative[] = doneTasks.map(task => {
      const [plat, cat] = task.key.split('_')
      return {
        id: generateId(),
        formatKey: task.key,
        platform: plat as PlatformId,
        category: cat,
        format: task.format,
        imageUrl: task.result!,
        createdAt: new Date(),
        sizeKB: 0,
      }
    })
    addCreatives(creatives)
    onClose()
  }
  
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div 
        ref={containerRef}
        style={{
          backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 24,
          width: 600, maxWidth: '90%', maxHeight: '80vh', overflow: 'auto',
        }} 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="magic-resize-title"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
          </div>
          <div>
            <h3 id="magic-resize-title" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Magic Resize</h3>
            <p style={{ margin: 0, fontSize: 14, color: COLORS.textSecondary }}>
              {tasks.length} formátů k převodu
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', width: 32, height: 32, border: 'none',
              borderRadius: 8, backgroundColor: COLORS.pageBg, cursor: 'pointer',
            }}
            aria-label="Zavřít"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        {/* Source info */}
        <div style={{
          padding: 12, backgroundColor: COLORS.pageBg, borderRadius: 8, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {sourceImage && (
            <img src={sourceImage} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Zdrojový obrázek</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              Poměr stran: {srcRatio.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Cost estimate */}
        {totalEstimatedCost > 0 && (
          <div style={{
            padding: 12, backgroundColor: COLORS.primaryLight, borderRadius: 8, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>💰</span>
            <span style={{ fontSize: 13, color: COLORS.primary }}>
              Odhadovaná cena: {formatPrice(totalEstimatedCost)}
            </span>
          </div>
        )}
        
        {/* Tasks */}
        <div style={{ maxHeight: 300, overflow: 'auto', marginBottom: 20 }}>
          {tasks.map(task => (
            <div key={task.key} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: `1px solid ${COLORS.borderLight}`,
            }}>
              <div style={{
                width: 40, height: 30, borderRadius: 4, backgroundColor: COLORS.pageBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: COLORS.textMuted,
              }}>
                {task.format.width}×{task.format.height}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{task.format.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  Metoda: {task.method === 'crop' ? '✂️ Ořez' : task.method === 'scale' ? '📐 Škálování' : '🎨 Outpaint'}
                </div>
              </div>
              <div>
                {task.status === 'pending' && <span style={{ color: COLORS.textMuted }}>⏳</span>}
                {task.status === 'processing' && <span style={{ color: COLORS.warning }}>⚡</span>}
                {task.status === 'done' && <span style={{ color: COLORS.success }}>✓</span>}
                {task.status === 'error' && <span style={{ color: COLORS.error }}>✗</span>}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress */}
        {isGenerating && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Zpracovávám...</span>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{progress}%</span>
            </div>
            <div style={{ height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2 }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                backgroundColor: COLORS.primary, borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
        
        {/* Summary */}
        {doneCount > 0 && (
          <div style={{
            padding: 12, backgroundColor: COLORS.successLight, borderRadius: 8, marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: COLORS.success, fontWeight: 500 }}>
              ✓ {doneCount} kreativ připraveno
              {errorCount > 0 && <span style={{ color: COLORS.error }}> ({errorCount} chyb)</span>}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', border: `1px solid ${COLORS.border}`,
            borderRadius: 8, backgroundColor: 'white', cursor: 'pointer',
            fontSize: 14, fontWeight: 500,
          }}>
            Zrušit
          </button>
          
          {doneCount > 0 ? (
            <button onClick={handleSave} style={{
              padding: '10px 20px', border: 'none', borderRadius: 8,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}>
              Uložit {doneCount} kreativ
            </button>
          ) : (
            <button 
              onClick={handleStart} 
              disabled={isGenerating || tasks.length === 0}
              style={{
                padding: '10px 20px', border: 'none', borderRadius: 8,
                background: isGenerating ? COLORS.textMuted : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: 'white', cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 500,
              }}
            >
              {isGenerating ? 'Zpracovávám...' : `Spustit (${tasks.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
