import { useAppStore } from '@/stores/app-store'
import { platforms } from '@/lib/platforms'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Settings, Sparkles } from 'lucide-react'
import type { PlatformId } from '@/types'

interface SidebarProps {
  onOpenSettings: () => void
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const { platform, category, setPlatform, setCategory } = useAppStore()
  const currentPlatform = platforms[platform]

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">AdCreative</h1>
            <p className="text-xs text-muted-foreground">Studio Pro</p>
          </div>
        </div>
      </div>

      {/* Platform Switch */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          {Object.entries(platforms).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setPlatform(key as PlatformId)}
              className={cn(
                'flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                platform === key
                  ? key === 'sklik'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-secondary text-muted-foreground border border-transparent hover:border-border'
              )}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Formáty
        </div>
        {Object.entries(currentPlatform.categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={cn('sidebar-item', category === key && 'active')}
          >
            <span className="text-lg">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{cat.name}</div>
              <div className="text-xs text-muted-foreground truncate">{cat.description}</div>
            </div>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              {cat.formats.length}
            </span>
          </button>
        ))}
      </nav>

      {/* Settings Button */}
      <div className="p-4 border-t border-border">
        <Button variant="secondary" className="w-full" onClick={onOpenSettings}>
          <Settings className="w-4 h-4" />
          API Nastavení
        </Button>
      </div>
    </aside>
  )
}
