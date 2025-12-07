import Head from 'next/head'
import { useAppStore } from '@/stores/app-store'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { InputPanel } from '@/components/panels/InputPanel'
import { FormatsPanel } from '@/components/panels/FormatsPanel'
import { EditorPanel } from '@/components/panels/EditorPanel'
import { ExportPanel } from '@/components/panels/ExportPanel'

export default function Home() {
  const { activeTab, darkMode } = useAppStore()

  return (
    <>
      <Head>
        <title>AdCreative Studio Pro | Sklik & Google Ads</title>
        <meta name="description" content="AI generátor reklamních kreativ pro Sklik a Google Ads" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen bg-background ${darkMode ? 'dark' : ''}`}>
        <Header />
        
        <div className="flex">
          <Sidebar />
          
          <main className="flex-1 p-6 ml-16">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'input' && <InputPanel />}
              {activeTab === 'formats' && <FormatsPanel />}
              {activeTab === 'editor' && <EditorPanel />}
              {activeTab === 'export' && <ExportPanel />}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
