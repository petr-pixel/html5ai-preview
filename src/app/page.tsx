'use client'

import { useAppStore } from '@/stores/app-store'
import { Header } from '@/components/Header'
import { InputPanel } from '@/components/InputPanel'
import { FormatSelector } from '@/components/FormatSelector'
import { CreativeEditor } from '@/components/CreativeEditor'
import { ExportPanel } from '@/components/ExportPanel'
import { VideoPanel } from '@/components/VideoPanel'
import { Html5SettingsPanel } from '@/components/Html5SettingsPanel'
import { Tabs, Card } from '@/components/ui'
import { ImagePlus, LayoutGrid, Edit3, Download, Film } from 'lucide-react'

export default function Home() {
  const { activeTab, setActiveTab, sourceImage, selectedFormats } = useAppStore()

  const tabs = [
    { id: 'input', label: 'Vstup', icon: <ImagePlus className="w-4 h-4" /> },
    { id: 'formats', label: 'Formáty', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'editor', label: 'Editor', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
  ]

  // Check if video formats are selected
  const hasVideoFormats = Array.from(selectedFormats).some(id => id.includes('video'))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {/* Navigation */}
        <div className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
          />
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              sourceImage ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${sourceImage ? 'bg-green-500' : 'bg-gray-300'}`} />
              Obrázek
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              selectedFormats.size > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${selectedFormats.size > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
              {selectedFormats.size} formátů
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              Export
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          {activeTab === 'input' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InputPanel />
              </div>
              <div className="space-y-6">
                <VideoPanel />
                <Html5SettingsPanel />
              </div>
            </div>
          )}
          {activeTab === 'formats' && <FormatSelector />}
          {activeTab === 'editor' && <CreativeEditor />}
          {activeTab === 'export' && <ExportPanel />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        AdCreative Studio • Sklik & Google Ads
      </footer>
    </div>
  )
}
