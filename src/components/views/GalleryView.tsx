import { Grid3X3 } from 'lucide-react'

export function GalleryView() {
    return (
        <div className="h-full flex items-center justify-center animate-fadeIn">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Grid3X3 className="w-8 h-8 text-white/40" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Galerie kreativ</h2>
                <p className="text-white/60">
                    Zatím nemáte žádné vygenerované kreativy
                </p>
            </div>
        </div>
    )
}
