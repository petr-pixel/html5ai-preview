import { useState, useRef, useEffect } from 'react'
import {
    Video, Play, Pause, Plus, Trash2, ChevronUp, ChevronDown,
    Image as ImageIcon, Clock, Download, Settings
} from 'lucide-react'
import { useStore } from '@/stores/app-store'

interface Slide {
    id: string
    imageUrl: string
    duration: number // seconds
    transition: 'fade' | 'slide' | 'zoom' | 'none'
}

export function VideoView() {
    const { sourceImage } = useStore()

    const [slides, setSlides] = useState<Slide[]>([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [totalDuration, setTotalDuration] = useState(0)

    const videoRef = useRef<HTMLDivElement>(null)

    // Add source image as first slide if available
    useEffect(() => {
        if (sourceImage && slides.length === 0) {
            setSlides([{
                id: Date.now().toString(),
                imageUrl: sourceImage,
                duration: 3,
                transition: 'fade'
            }])
        }
    }, [sourceImage])

    // Calculate total duration
    useEffect(() => {
        const total = slides.reduce((sum, slide) => sum + slide.duration, 0)
        setTotalDuration(total)
    }, [slides])

    // Auto-play logic
    useEffect(() => {
        if (!isPlaying || slides.length === 0) return

        const timer = setTimeout(() => {
            if (currentSlide < slides.length - 1) {
                setCurrentSlide(prev => prev + 1)
            } else {
                setCurrentSlide(0)
                setIsPlaying(false)
            }
        }, slides[currentSlide]?.duration * 1000 || 3000)

        return () => clearTimeout(timer)
    }, [isPlaying, currentSlide, slides])

    const addSlide = () => {
        // For now, duplicate last slide or add placeholder
        const newSlide: Slide = {
            id: Date.now().toString(),
            imageUrl: sourceImage || '',
            duration: 3,
            transition: 'fade'
        }
        setSlides([...slides, newSlide])
    }

    const removeSlide = (id: string) => {
        setSlides(slides.filter(s => s.id !== id))
    }

    const updateSlide = (id: string, updates: Partial<Slide>) => {
        setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const moveSlide = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= slides.length) return

        const newSlides = [...slides]
        const temp = newSlides[index]
        newSlides[index] = newSlides[newIndex]
        newSlides[newIndex] = temp
        setSlides(newSlides)
    }

    if (!sourceImage) {
        return (
            <div className="h-full flex items-center justify-center animate-fadeIn">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-white/40" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Video Builder</h2>
                    <p className="text-white/60">
                        Nejdříve vygenerujte obrázek v Generátoru
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex gap-4 animate-fadeIn">
            {/* Preview Area */}
            <div className="flex-1 flex flex-col">
                <div className="glass-card p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="btn-accent p-3"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <div className="text-sm">
                            <span className="text-white/60">Délka:</span>{' '}
                            <span className="font-medium">{totalDuration}s</span>
                        </div>
                    </div>

                    <button className="glass-button flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" />
                        Export MP4
                    </button>
                </div>

                {/* Video Preview */}
                <div
                    ref={videoRef}
                    className="flex-1 bg-[#0a0a0a] rounded-xl flex items-center justify-center overflow-hidden"
                >
                    {slides[currentSlide] && (
                        <img
                            src={slides[currentSlide].imageUrl}
                            alt={`Slide ${currentSlide + 1}`}
                            className="max-w-full max-h-full object-contain transition-opacity duration-500"
                            style={{
                                opacity: isPlaying ? 1 : 0.9,
                            }}
                        />
                    )}
                </div>

                {/* Timeline */}
                <div className="mt-4 p-3 glass-card">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.id}
                                onClick={() => setCurrentSlide(index)}
                                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${index === currentSlide
                                        ? 'border-accent'
                                        : 'border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <img
                                    src={slide.imageUrl}
                                    alt={`Slide ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                        <button
                            onClick={addSlide}
                            className="flex-shrink-0 w-20 h-14 rounded-lg border-2 border-dashed border-white/20 hover:border-accent flex items-center justify-center transition-all"
                        >
                            <Plus className="w-5 h-5 text-white/40" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel - Slide Settings */}
            <div className="w-80 glass-card p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-accent" />
                    Nastavení slidu
                </h3>

                {slides[currentSlide] && (
                    <>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Délka (sekundy)</label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={slides[currentSlide].duration}
                                onChange={(e) => updateSlide(slides[currentSlide].id, { duration: parseInt(e.target.value) || 3 })}
                                className="input text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/60 mb-1">Přechod</label>
                            <select
                                value={slides[currentSlide].transition}
                                onChange={(e) => updateSlide(slides[currentSlide].id, { transition: e.target.value as Slide['transition'] })}
                                className="input text-sm"
                            >
                                <option value="none">Žádný</option>
                                <option value="fade">Fade</option>
                                <option value="slide">Slide</option>
                                <option value="zoom">Zoom (Ken Burns)</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => moveSlide(currentSlide, 'up')}
                                disabled={currentSlide === 0}
                                className="glass-button flex-1 py-2 disabled:opacity-30"
                            >
                                <ChevronUp className="w-4 h-4 mx-auto" />
                            </button>
                            <button
                                onClick={() => moveSlide(currentSlide, 'down')}
                                disabled={currentSlide === slides.length - 1}
                                className="glass-button flex-1 py-2 disabled:opacity-30"
                            >
                                <ChevronDown className="w-4 h-4 mx-auto" />
                            </button>
                            <button
                                onClick={() => removeSlide(slides[currentSlide].id)}
                                disabled={slides.length <= 1}
                                className="glass-button flex-1 py-2 text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                            >
                                <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                        </div>
                    </>
                )}

                <div className="border-t border-white/10 pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-2">Celková délka</h4>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <Clock className="w-4 h-4" />
                        <span>{totalDuration} sekund</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
