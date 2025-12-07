'use client'

import { useAppStore } from '@/stores/app-store'
import { Card } from '@/components/ui'
import type { Html5Template } from '@/types'
import { Code, Play, Zap, ZoomIn, ArrowUp } from 'lucide-react'

const templates: { id: Html5Template; name: string; description: string; icon: React.ReactNode }[] = [
  { id: 'fade-in', name: 'Fade In', description: 'Plynulé objevení', icon: <Play className="w-4 h-4" /> },
  { id: 'slide-up', name: 'Slide Up', description: 'Vyjetí zespodu', icon: <ArrowUp className="w-4 h-4" /> },
  { id: 'pulse-cta', name: 'Pulse CTA', description: 'Pulzující tlačítko', icon: <Zap className="w-4 h-4" /> },
  { id: 'zoom-in', name: 'Zoom In', description: 'Přiblížení', icon: <ZoomIn className="w-4 h-4" /> },
  { id: 'bounce', name: 'Bounce', description: 'Odskočení', icon: <Zap className="w-4 h-4" /> },
]

export function Html5SettingsPanel() {
  const { html5Settings, setHtml5Settings } = useAppStore()

  return (
    <Card>
      <h3 className="font-medium mb-4 flex items-center gap-2">
        <Code className="w-5 h-5 text-gray-400" />
        HTML5 Animace
      </h3>

      <div className="space-y-4">
        {/* Template Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Šablona animace</label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setHtml5Settings({ template: template.id })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  html5Settings.template === template.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {template.icon}
                  <span className="font-medium text-sm">{template.name}</span>
                </div>
                <p className="text-xs text-gray-500">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Animation Duration */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Délka animace: {html5Settings.animationDuration}s
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={html5Settings.animationDuration}
            onChange={(e) => setHtml5Settings({ animationDuration: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Loop */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={html5Settings.loop}
            onChange={(e) => setHtml5Settings({ loop: e.target.checked })}
            className="rounded"
          />
          Opakovat animaci (loop)
        </label>

        <p className="text-xs text-gray-500">
          HTML5 bannery používají GSAP knihovnu (whitelisted pro Sklik).
        </p>
      </div>
    </Card>
  )
}
