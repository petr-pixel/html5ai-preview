import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { GeneratorView } from '@/components/views/GeneratorView'
import { EditorView } from '@/components/views/EditorView'
import { GalleryView } from '@/components/views/GalleryView'
import { VideoView } from '@/components/views/VideoView'
import { SettingsView } from '@/components/views/SettingsView'

export type ViewType = 'generator' | 'editor' | 'gallery' | 'video' | 'settings'

function App() {
    const [currentView, setCurrentView] = useState<ViewType>('generator')

    const renderView = () => {
        switch (currentView) {
            case 'generator':
                return <GeneratorView onGenerate={() => setCurrentView('editor')} />
            case 'editor':
                return <EditorView />
            case 'gallery':
                return <GalleryView />
            case 'video':
                return <VideoView />
            case 'settings':
                return <SettingsView />
            default:
                return <GeneratorView onGenerate={() => setCurrentView('editor')} />
        }
    }

    return (
        <div className="h-screen flex flex-col bg-dark-900 mesh-gradient">
            <Header />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar currentView={currentView} onViewChange={setCurrentView} />
                <main className="flex-1 overflow-auto p-6">
                    {renderView()}
                </main>
            </div>
        </div>
    )
}

export default App
