import { Video } from 'lucide-react'

export function VideoView() {
    return (
        <div className="h-full flex items-center justify-center animate-fadeIn">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-white/40" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Video Builder</h2>
                <p className="text-white/60">
                    Vytvořte slideshow video z obrázků
                </p>
            </div>
        </div>
    )
}
