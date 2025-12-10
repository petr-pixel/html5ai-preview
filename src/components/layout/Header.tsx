import { Sparkles, Settings, User } from 'lucide-react'

export function Header() {
    return (
        <header className="h-14 flex items-center justify-between px-4 border-b border-white/10 bg-dark-700/50 backdrop-blur-xl">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg">AdCreative Studio</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                <button className="glass-button p-2">
                    <Settings className="w-5 h-5" />
                </button>
                <button className="glass-button p-2">
                    <User className="w-5 h-5" />
                </button>
            </div>
        </header>
    )
}
