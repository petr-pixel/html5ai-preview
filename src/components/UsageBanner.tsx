/**
 * UsageBanner - Zobrazuje zbývající limity pro free uživatele
 */

import React from 'react'
import { useUsageLimits } from '@/hooks/useUsageLimits'
import { Zap, Image, FileText, Download, Crown, X } from 'lucide-react'

interface UsageBannerProps {
  onUpgrade?: () => void
  onDismiss?: () => void
  compact?: boolean
}

export function UsageBanner({ onUpgrade, onDismiss, compact = false }: UsageBannerProps) {
  const { stats, loading, isFreePlan } = useUsageLimits()
  
  // Don't show for pro/enterprise users
  if (!isFreePlan || loading || !stats) return null
  
  const items = [
    { 
      icon: Image, 
      label: 'AI Obrázky', 
      used: stats.used.ai_image_today, 
      limit: stats.limits.ai_image_daily,
      remaining: stats.remaining.ai_image 
    },
    { 
      icon: FileText, 
      label: 'AI Copy', 
      used: stats.used.ai_copy_today, 
      limit: stats.limits.ai_copy_daily,
      remaining: stats.remaining.ai_copy 
    },
    { 
      icon: Download, 
      label: 'Exporty', 
      used: stats.used.export_month, 
      limit: stats.limits.export_monthly,
      remaining: stats.remaining.export,
      period: 'měsíc'
    },
  ]
  
  // Check if any limit is close (< 30%)
  const hasWarning = items.some(item => 
    item.limit > 0 && (item.remaining / item.limit) < 0.3
  )
  
  if (compact) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20">
        <Zap className="w-4 h-4 text-purple-400" />
        <div className="flex items-center gap-4 text-sm">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <item.icon className="w-3.5 h-3.5 text-white/40" />
              <span className={`${item.remaining < 3 ? 'text-red-400' : 'text-white/60'}`}>
                {item.remaining === -1 ? '∞' : item.remaining}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onUpgrade}
          className="ml-auto text-xs px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white font-medium hover:from-purple-600 hover:to-blue-600"
        >
          Upgrade
        </button>
      </div>
    )
  }
  
  return (
    <div className={`p-4 rounded-xl ${hasWarning ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5 border border-white/10'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${hasWarning ? 'text-yellow-400' : 'text-blue-400'}`} />
          <span className="font-medium text-white">Denní limity (Free)</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4 text-white/40" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        {items.map((item, i) => {
          const percentage = item.limit > 0 ? (item.remaining / item.limit) * 100 : 100
          const isLow = percentage < 30
          
          return (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <item.icon className={`w-4 h-4 ${isLow ? 'text-yellow-400' : 'text-white/40'}`} />
                <span className="text-xs text-white/60">{item.label}</span>
              </div>
              <div className={`text-lg font-bold ${isLow ? 'text-yellow-400' : 'text-white'}`}>
                {item.remaining === -1 ? '∞' : item.remaining}
                <span className="text-sm font-normal text-white/40">/{item.limit}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isLow ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      
      <button
        onClick={onUpgrade}
        className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-sm font-medium text-white hover:from-purple-600 hover:to-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Crown className="w-4 h-4" />
        Upgrade na Pro - Neomezené použití
      </button>
    </div>
  )
}

// Komponenta pro zobrazení při dosažení limitu
export function LimitReachedModal({ 
  action, 
  onClose, 
  onUpgrade 
}: { 
  action: string
  onClose: () => void
  onUpgrade: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-white/10 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-yellow-400" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Denní limit dosažen</h3>
        <p className="text-white/60 mb-6">
          Dosáhli jste denního limitu pro {action} na Free plánu. 
          Upgradujte na Pro pro neomezené použití.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Zavřít
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-blue-600 transition-colors"
          >
            Upgrade na Pro
          </button>
        </div>
      </div>
    </div>
  )
}
