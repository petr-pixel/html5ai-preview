import { Wand2, Edit3, Grid3X3, Video, Settings, Palette, Download, Package } from 'lucide-react'
import type { ViewType } from '@/App'
import { useStore } from '@/stores/app-store'

interface SidebarProps {
    currentView: ViewType
    onViewChange: (view: ViewType) => void
}

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'generator', label: 'Generátor', icon: <Wand2 className="w-5 h-5" /> },
    { id: 'editor', label: 'Editor', icon: <Edit3 className="w-5 h-5" /> },
    { id: 'gallery', label: 'Galerie', icon: <Grid3X3 className="w-5 h-5" /> },
    { id: 'video', label: 'Video', icon: <Video className="w-5 h-5" /> },
    { id: 'brandkit', label: 'Brand Kit', icon: <Palette className="w-5 h-5" /> },
]

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    const { selectedFormats, sourceImage } = useStore()

    const hasCreatives = sourceImage && selectedFormats.length > 0

    return (
        <aside className="w-60 border-r border-white/10 bg-dark-700/30 backdrop-blur-xl flex flex-col">
            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                <div className="text-xs text-white/40 uppercase tracking-wider px-3 py-2">
                    Nástroje
                </div>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`sidebar-item w-full ${currentView === item.id ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}

                <div className="text-xs text-white/40 uppercase tracking-wider px-3 py-2 mt-6">
                    Export
                </div>

                {/* Quick Export Button */}
                <button
                    className={`sidebar-item w-full ${!hasCreatives ? 'opacity-50' : ''}`}
                    disabled={!hasCreatives}
                >
                    <Package className="w-5 h-5" />
                    <span>Export ZIP</span>
                    {hasCreatives && (
                        <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                            {selectedFormats.length}
                        </span>
                    )}
                </button>

                <button
                    className={`sidebar-item w-full ${!hasCreatives ? 'opacity-50' : ''}`}
                    disabled={!hasCreatives}
                >
                    <Download className="w-5 h-5" />
                    <span>Export HTML5</span>
                </button>
            </nav>

            {/* Settings */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={() => onViewChange('settings')}
                    className={`sidebar-item w-full ${currentView === 'settings' ? 'active' : ''}`}
                >
                    <Settings className="w-5 h-5" />
                    <span>Nastavení</span>
                </button>
            </div>
        </aside>
    )
}
