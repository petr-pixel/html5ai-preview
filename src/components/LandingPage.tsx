/**
 * Landing Page - zobrazí se nepřihlášeným uživatelům
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Image,
  Video,
  Palette,
  LayoutGrid,
  ArrowRight,
  Check,
  Star,
  Users,
  Globe,
  Shield,
} from 'lucide-react'

interface LandingPageProps {
  onLogin: () => void
  onRegister: () => void
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Generování',
      description: 'GPT-4o vytvoří profesionální reklamní obrázky z textového popisu',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: LayoutGrid,
      title: '30+ Formátů',
      description: 'Všechny formáty pro Sklik a Google Ads na jedno kliknutí',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Zap,
      title: 'Magic Resize',
      description: 'Automatická úprava pro všechny velikosti s AI outpaintingem',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Video,
      title: 'Video Studio',
      description: 'Slideshow, animace a AI video generování',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Palette,
      title: 'Brand Kit',
      description: 'Uložte si barvy, fonty a loga pro konzistentní kreativy',
      color: 'from-red-500 to-rose-500',
    },
    {
      icon: Image,
      title: 'Smart Crop',
      description: 'Inteligentní ořez s detekcí hlavního objektu',
      color: 'from-indigo-500 to-violet-500',
    },
  ]

  const pricing = [
    {
      name: 'Free',
      price: '0 Kč',
      period: 'navždy',
      features: [
        '10 generování denně',
        'Základní formáty',
        '100 MB úložiště',
        'Watermark na exportu',
      ],
      cta: 'Začít zdarma',
      popular: false,
    },
    {
      name: 'Pro',
      price: '499 Kč',
      period: 'měsíc',
      features: [
        'Neomezené generování',
        'Všechny formáty',
        '10 GB úložiště',
        'Bez watermarku',
        'Prioritní podpora',
        'API přístup',
      ],
      cta: 'Vyzkoušet Pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Na míru',
      period: '',
      features: [
        'Vše z Pro',
        'Neomezené úložiště',
        'Vlastní branding',
        'SLA garance',
        'Dedikovaný account manager',
      ],
      cta: 'Kontaktovat nás',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">AdCreative Studio</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Přihlásit se
            </button>
            <button
              onClick={onRegister}
              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25"
            >
              Vyzkoušet zdarma
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm mb-6">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Jediný nástroj v Česku s nativní podporou Sklik</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
              Reklamní kreativy<br />za pár sekund
            </h1>
            
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              AI generuje profesionální bannery pro Sklik a Google Ads. 
              Zadejte popis, vyberte formáty, stáhněte hotové kreativy.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onRegister}
                className="group px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl shadow-purple-500/30 flex items-center gap-2"
              >
                Začít zdarma
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onLogin}
                className="px-8 py-4 text-lg font-medium bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                Mám účet
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { value: '30+', label: 'Formátů' },
              { value: '< 10s', label: 'Generování' },
              { value: '1000+', label: 'Uživatelů' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Vše co potřebujete</h2>
            <p className="text-white/60 text-lg">Kompletní nástroj pro tvorbu reklamních kreativ</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Podporované platformy</h2>
          <p className="text-white/60 text-lg mb-12">Generujte kreativy přesně podle specifikací</p>
          
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#cc0000] flex items-center justify-center text-white font-bold">S</div>
              <div className="text-left">
                <div className="font-semibold">Sklik</div>
                <div className="text-sm text-white/50">Seznam.cz</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 flex items-center justify-center text-white font-bold">G</div>
              <div className="text-left">
                <div className="font-semibold">Google Ads</div>
                <div className="text-sm text-white/50">Display & P-Max</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Jednoduché ceny</h2>
            <p className="text-white/60 text-lg">Začněte zdarma, upgradujte kdykoliv</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-6 rounded-2xl border ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-purple-500/20 to-blue-500/20 border-purple-500/50' 
                    : 'bg-white/5 border-white/10'
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-xs font-semibold">
                    Nejpopulárnější
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold">{plan.price}</div>
                  {plan.period && <div className="text-white/50">/ {plan.period}</div>}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-white/80">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={onRegister}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="font-semibold">Bezpečné</h3>
              <p className="text-white/50 text-sm">GDPR compliant, data v EU</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="font-semibold">Česky</h3>
              <p className="text-white/50 text-sm">Plná lokalizace a podpora</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-semibold">Podpora</h3>
              <p className="text-white/50 text-sm">Odpovídáme do 24 hodin</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Připraveni začít?</h2>
          <p className="text-white/60 text-lg mb-8">
            Vytvořte si účet zdarma a vygenerujte první kreativy během minuty.
          </p>
          <button
            onClick={onRegister}
            className="group px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl shadow-purple-500/30 flex items-center gap-2 mx-auto"
          >
            Začít zdarma
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/50">
            <Sparkles className="w-5 h-5" />
            <span>AdCreative Studio © 2024</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="#" className="hover:text-white transition-colors">Podmínky</a>
            <a href="#" className="hover:text-white transition-colors">Ochrana soukromí</a>
            <a href="#" className="hover:text-white transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
