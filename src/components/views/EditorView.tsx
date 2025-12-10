import { Edit3 } from 'lucide-react'

export function EditorView() {
    return (
        <div className="h-full flex items-center justify-center animate-fadeIn">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-8 h-8 text-white/40" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Editor kreativ</h2>
                <p className="text-white/60">
                    Nejdříve vygenerujte kreativy v Generátoru
                </p>
            </div>
        </div>
    )
}
