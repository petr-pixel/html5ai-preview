/**
 * Video Generation Status & Alternatives
 * 
 * Informuje uživatele o stavu video generování a nabízí alternativy.
 */

import { useState } from 'react'
import { 
  Video, AlertCircle, ExternalLink, Sparkles, 
  Clock, DollarSign, Zap, Play, Film, Wand2
} from 'lucide-react'

// ============================================================================
// VIDEO STATUS BANNER
// ============================================================================

export function VideoStatusBanner() {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Video generování
              </h3>
              <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-full">
                Připravujeme
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              OpenAI Sora 2 API zatím není veřejně dostupné. Sledujeme novinky a integrujeme jakmile bude možné.
            </p>
          </div>
          
          <button className="text-purple-600 dark:text-purple-400 text-sm font-medium">
            {expanded ? 'Skrýt' : 'Alternativy'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-purple-200 dark:border-purple-800 mt-2 pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Dostupné alternativy pro video reklamy:
          </h4>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <VideoAlternativeCard
              name="Runway ML"
              description="Gen-3 Alpha - špičkový AI video model"
              price="od $12/měsíc"
              url="https://runwayml.com"
              features={['Text-to-video', 'Image-to-video', 'Lip sync']}
            />
            
            <VideoAlternativeCard
              name="Pika Labs"
              description="Rychlé a kvalitní AI video"
              price="od $8/měsíc"
              url="https://pika.art"
              features={['Stylizace', 'Rychlé generování', 'Web editor']}
            />
            
            <VideoAlternativeCard
              name="Luma Dream Machine"
              description="Realistické AI video"
              price="od $24/měsíc"
              url="https://lumalabs.ai/dream-machine"
              features={['5s klipy', 'Vysoká kvalita', 'API dostupné']}
            />
            
            <VideoAlternativeCard
              name="Canva Video"
              description="Jednoduché video z obrázků"
              price="v Canva Pro"
              url="https://canva.com"
              features={['Templates', 'Stock videa', 'Animace']}
            />
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Zatím můžete:
                </p>
                <ul className="mt-1 text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Vytvořit statické kreativy zde</li>
                  <li>• Exportovat jako HTML5 s animací</li>
                  <li>• Použít kreativy jako first-frame v externích nástrojích</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// VIDEO ALTERNATIVE CARD
// ============================================================================

interface VideoAlternativeCardProps {
  name: string
  description: string
  price: string
  url: string
  features: string[]
}

function VideoAlternativeCard({ name, description, price, url, features }: VideoAlternativeCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {name}
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          {price}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-1 mt-2">
        {features.map((f, i) => (
          <span
            key={i}
            className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
          >
            {f}
          </span>
        ))}
      </div>
    </a>
  )
}

// ============================================================================
// VIDEO COMING SOON PLACEHOLDER
// ============================================================================

export function VideoComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
          <Film className="w-12 h-12 text-purple-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <Clock className="w-4 h-4 text-yellow-900" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Video generování brzy!
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        Pracujeme na integraci AI video generování. Jakmile OpenAI zpřístupní Sora API nebo najdeme vhodnou alternativu, budete první, kdo se dozví.
      </p>
      
      {/* Expected features */}
      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl mb-8">
        <FeaturePreview
          icon={<Wand2 className="w-6 h-6" />}
          title="Text-to-Video"
          description="Vytvořte video z popisu"
        />
        <FeaturePreview
          icon={<Play className="w-6 h-6" />}
          title="Image-to-Video"
          description="Animujte své kreativy"
        />
        <FeaturePreview
          icon={<Zap className="w-6 h-6" />}
          title="Quick Edits"
          description="6s bumper ads za vteřiny"
        />
      </div>
      
      {/* CTA */}
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="https://openai.com/sora"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
        >
          Sledovat OpenAI Sora
          <ExternalLink className="w-4 h-4" />
        </a>
        
        <a
          href="https://runwayml.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Vyzkoušet Runway ML
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

function FeaturePreview({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
        {icon}
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  )
}

// ============================================================================
// VIDEO TIMELINE (for future use)
// ============================================================================

export function VideoTimeline() {
  const milestones = [
    { date: 'Q4 2024', title: 'Sora Preview', status: 'done' },
    { date: 'Q1 2025', title: 'Sora API Beta', status: 'current' },
    { date: 'Q2 2025', title: 'Integrace', status: 'upcoming' },
  ]
  
  return (
    <div className="flex items-center justify-center gap-4 p-4">
      {milestones.map((m, i) => (
        <div key={i} className="flex items-center">
          <div className="text-center">
            <div
              className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                m.status === 'done' ? 'bg-green-500' :
                m.status === 'current' ? 'bg-blue-500 animate-pulse' :
                'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <p className="text-xs font-medium text-gray-900 dark:text-white">{m.title}</p>
            <p className="text-xs text-gray-500">{m.date}</p>
          </div>
          
          {i < milestones.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${
              m.status === 'done' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default {
  VideoStatusBanner,
  VideoComingSoon,
  VideoTimeline,
}
