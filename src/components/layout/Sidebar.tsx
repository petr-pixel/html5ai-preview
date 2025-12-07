import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { 
  ImagePlus, 
  LayoutGrid, 
  Edit3, 
  Download,
  ChevronRight
} from 'lucide-react'

const navItems = [
  { id: 'input', label: 'Vstup', icon: ImagePlus, description: 'Generuj nebo nahraj obrázek' },
  { id: 'formats', label: 'Formáty', icon: LayoutGrid, description: 'Vyber formáty pro export' },
  { id: 'editor', label: 'Editor', icon: Edit3, description: 'Uprav jednotlivé kreativy' },
  { id: 'export', label: 'Export', icon: Download, description: 'Stáhni hotové kreativy' },
] as const

export function Sidebar() {
  const { activeTab, setActiveTab, sourceImage, selectedFormats } = useAppStore()

  const getStepStatus = (id: string) => {
    switch (id) {
      case 'input':
        return sourceImage ? 'complete' : 'current'
      case 'formats':
        if (!sourceImage) return 'locked'
        return selectedFormats.size > 0 ? 'complete' : 'current'
      case 'editor':
        if (!sourceImage || selectedFormats.size === 0) return 'locked'
        return 'current'
      case 'export':
        if (!sourceImage || selectedFormats.size === 0) return 'locked'
        return 'current'
      default:
        return 'locked'
    }
  }

  return (
    <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-16 border-r bg-background">
      <nav className="flex flex-col items-center gap-2 p-2">
        {navItems.map((item, index) => {
          const status = getStepStatus(item.id)
          const isActive = activeTab === item.id
          const isLocked = status === 'locked'
          const isComplete = status === 'complete'

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    'relative w-12 h-12',
                    isLocked && 'opacity-50 cursor-not-allowed',
                    isComplete && !isActive && 'text-green-600'
                  )}
                  onClick={() => !isLocked && setActiveTab(item.id)}
                  disabled={isLocked}
                >
                  <item.icon className="h-5 w-5" />
                  {isComplete && !isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                  )}
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {isLocked && (
                  <p className="text-xs text-destructive mt-1">
                    Dokončete předchozí krok
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {/* Progress line */}
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-0.5 h-40 bg-muted">
        <div 
          className="w-full bg-primary transition-all duration-300"
          style={{
            height: `${
              activeTab === 'input' ? 0 :
              activeTab === 'formats' ? 33 :
              activeTab === 'editor' ? 66 :
              100
            }%`
          }}
        />
      </div>
    </aside>
  )
}
