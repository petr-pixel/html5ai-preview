import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightPanel } from '@/components/layout/RightPanel'
import { CenterContent } from '@/components/layout/CenterContent'
import { SIZES } from '@/lib/design-tokens'
import type { Format } from '@/types'

interface EditorViewProps {
  onOpenTextEditor: () => void
  onEditFormat: (format: { key: string; format: Format } | null) => void
  onMagicResize: () => void
  onOpenTemplates: () => void
  onChangeView: (view: string) => void
}

export function EditorView({ 
  onOpenTextEditor, 
  onEditFormat, 
  onMagicResize, 
  onOpenTemplates, 
  onChangeView 
}: EditorViewProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${SIZES.leftSidebar}px 1fr ${SIZES.rightPanel}px`,
      height: '100%',
      overflow: 'hidden',
    }}>
      <LeftSidebar 
        onMagicResize={onMagicResize} 
        onOpenTemplates={onOpenTemplates} 
        onChangeView={onChangeView}
      />
      <CenterContent 
        onOpenTextEditor={onOpenTextEditor} 
        onEditFormat={onEditFormat} 
        onMagicResize={onMagicResize} 
      />
      <RightPanel onOpenTextEditor={onOpenTextEditor} />
    </div>
  )
}
