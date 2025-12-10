import { Wand2, Edit3, Grid3X3, Video, Settings, History, Download } from 'lucide-react'
import type { ViewType } from '@/App'

interface SidebarProps {
    currentView: ViewType
    onViewChange: (view: ViewType) => void
}

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'generator', label: 'Generátor', icon: <Wand2 className="w-5 h-5" /> },
    { id: 'editor', label: 'Editor', icon: <Edit3 className="w-5 h-5" /> },
    { id: 'gallery', label: 'Galerie', icon: <Grid3X3 className="w-5 h-5" /> },
    { id: 'video', label: 'Video', icon: <Video className="w-5 h-5" /> },
]

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
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
                    Správa
                </div>
                <button className="sidebar-item w-full">
                    <History className="w-5 h-5" />
                    <span>Historie</span>
                </button>
                <button className="sidebar-item w-full">
                    <Download className="w-5 h-5" />
                    <span>Export</span>
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
