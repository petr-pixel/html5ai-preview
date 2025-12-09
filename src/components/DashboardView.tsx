import React from 'react'
import { useAppStore } from '@/stores/app-store'
import {
    Images,
    LayoutGrid,
    Sparkles,
    Zap,
    Wand2,
    ScanLine,
    Download,
    ArrowRight
} from 'lucide-react'
import type { ViewType } from './UnifiedSidebar'

interface DashboardViewProps {
    onViewChange?: (view: ViewType) => void
    onOpenBrandKit?: () => void
    onExportAll?: () => void
}

export function DashboardView({ onViewChange, onOpenBrandKit, onExportAll }: DashboardViewProps) {
    const { creatives, selectedFormats } = useAppStore()

    const creativesArray = Object.values(creatives) as any[]

    const stats = [
        {
            label: 'Kreativy',
            value: creativesArray.length,
            icon: Images,
            gradient: 'from-violet-500 to-purple-600',
            iconBg: 'stat-card-icon',
            glow: 'shadow-violet-500/20'
        },
        {
            label: 'Formáty',
            value: selectedFormats.size,
            icon: LayoutGrid,
            gradient: 'from-cyan-500 to-blue-600',
            iconBg: 'stat-card-icon-cyan',
            glow: 'shadow-cyan-500/20'
        },
        {
            label: 'Tento měsíc',
            value: creativesArray.filter(c => {
                const d = new Date(c.createdAt)
                const now = new Date()
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length,
            icon: Sparkles,
            gradient: 'from-emerald-500 to-teal-600',
            iconBg: 'stat-card-icon-green',
            glow: 'shadow-emerald-500/20'
        },
    ]

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-white/50">Vítejte zpět! Zde je přehled vašich kreativ.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group ${stat.glow}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white tracking-tight">{stat.value}</div>
                                <div className="text-sm text-white/50 font-medium">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Creatives */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Images className="w-5 h-5 text-violet-400" />
                        Poslední kreativy
                    </h2>
                    {creativesArray.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <Images className="w-8 h-8 text-white/30" />
                            </div>
                            <p className="text-white/50 text-sm mb-2">Zatím žádné kreativy</p>
                            <p className="text-white/30 text-xs">Začněte generovat v sekci Generátor</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            {creativesArray.slice(0, 8).map((creative) => (
                                <div key={creative.id} className="aspect-square rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 hover:ring-violet-500/50 transition-all cursor-pointer relative group">
                                    <img src={creative.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        Rychlé akce
                    </h2>
                    <div className="space-y-3">
                        <button
                            onClick={() => onViewChange?.('formats')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 transition-all duration-200 text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                                <Wand2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-semibold">Generátor</div>
                                <div className="text-xs text-white/50">Vygenerujte reklamní kreativy</div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                            onClick={() => onOpenBrandKit?.()}
                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all duration-200 text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                                <ScanLine className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-semibold">AI Branding Kit</div>
                                <div className="text-xs text-white/50">Extrahovat z webu barvy a texty</div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                            onClick={() => onExportAll?.()}
                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all duration-200 text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                                <Download className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-semibold">Exportovat vše</div>
                                <div className="text-xs text-white/50">Stáhnout všechny kreativy jako ZIP</div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
