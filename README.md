# 🎨 AdCreative Studio v4 - Production Ready

Profesionální nástroj pro generování reklamních kreativ pro **Sklik** a **Google Ads** s plnou podporou oficiálních specifikací.

## ✨ Hlavní funkce

### 🖼️ Statické bannery
- **Multi-variace** - generování 3-5 variant z jednoho promptu
- **Smart Crop** - inteligentní ořezávání s detekcí hlavního objektu
- **Safe Zones** - vizualizace ochranných zón (Branding, Interscroller)
- **Automatická komprese** - dodržení limitů (150 kB / 250 kB / 5 MB)

### ✨ HTML5 bannery
- **5 animačních šablon** - static, fade-in, slide-up, ken-burns, pulse-cta
- **ZIP export** - kompletní balíček (HTML + CSS + JS + assets)
- **P-Max meta tagy** - pro Google Performance Max

### 🎬 Video Engine (3 tiery)
- **Tier 1: Slideshow** - klientské generování (zdarma, Ken Burns efekt)
- **Tier 2: Motion AI** - Replicate API (image-to-video)
- **Tier 3: Generative AI** - Sora 2 / Sora 2 Pro (text-to-video)

### 🎨 Brand Management
- **Brand Kit** - loga, barvy, fonty
- **Automatická aplikace** - na všechny kreativy

### 🤖 AI Nástroje (Ctrl+K)
- **Creative Scoring** - Predikce CTR, heatmapa pozornosti, doporučení
- **AI Copywriter** - AIDA/PAS/4U frameworky, multi-jazyk
- **Magic Resize** - Všechny formáty jedním klikem
- **Template Library** - Šablony podle odvětví (e-commerce, food, travel...)
- **Landing Page Scanner** - Extrakce barev a textů z URL

### ☁️ Cloud & Auth
- **Supabase** - Free tier: neomezení uživatelé + 1GB storage
- **Google OAuth** - Přihlášení jedním klikem
- **Sync** - Synchronizace Brand Kitů a kreativ

## 📋 Podporované platformy a formáty

### Sklik (Seznam.cz)

| Kategorie | Formáty | Max velikost | Safe Zone |
|-----------|---------|--------------|-----------|
| Kombinovaná reklama | 1.91:1, 1:1, loga | 1 MB | ❌ |
| Bannery | 14 formátů | 250 kB | ❌ |
| HTML5 | 10 formátů | 250 kB | ❌ |
| **Branding** | 2000×1400 | 500 kB | ✅ 1366×720 |
| **Interscroller** | 720×1280 | 250 kB | ✅ 700×920 |
| Zboží.cz | 2 formáty | 100 kB | ❌ |
| Video | 16:9, 9:16, 1:1 | 100 MB | ❌ |

### Google Ads

| Kategorie | Formáty | Max velikost |
|-----------|---------|--------------|
| P-Max Obrázky | 1.91:1, 1:1, 4:5 | **5 MB** |
| P-Max Loga | 1:1, 4:1 | 5 MB |
| Responsive Display | 1.91:1, 1:1, loga | 5 MB |
| Display Bannery | 16 formátů | **150 kB** |
| YouTube Video | 16:9, 9:16, 1:1 | 256 MB |

## 🚀 Instalace a spuštění

```bash
# Rozbal archiv
unzip adcreative-studio-v4-production.zip
cd adcreative-studio

# Nainstaluj závislosti
npm install

# Spusť vývojový server
npm run dev

# Build pro produkci
npm run build
```

## ⚙️ Konfigurace

### API klíče

Nastavte v Settings (ikona ozubeného kola):

- **OpenAI API Key** - pro generování obrázků (gpt-image-1) a videí (Sora 2)

### Cenový přehled

| Služba | Model | Cena |
|--------|-------|------|
| Obrázky | gpt-image-1 | $0.011-0.032/img |
| Text | gpt-4o-mini | $0.15/1M tokens |
| Video | sora-2 | $0.10/sec |
| Video | sora-2-pro | $0.40/sec |

## 📁 Struktura projektu

```
src/
├── components/
│   ├── BrandKitManager.tsx    # Brand Kit správa
│   ├── FormatCard.tsx         # Karta formátu (s Safe Zone)
│   ├── SafeZoneOverlay.tsx    # Vizualizace ochranných zón
│   ├── VideoGenerator.tsx     # Video generátor (3 tiery)
│   ├── VideoScenarioEditor.tsx # Sora 2 editor
│   ├── GalleryView.tsx        # Galerie kreativ
│   ├── QualityCheck.tsx       # Kontrola limitů
│   └── ...
├── lib/
│   ├── platforms.ts           # Definice formátů (Sklik/Google)
│   ├── smart-crop.ts          # Smart crop engine
│   ├── video-engine.ts        # Video generování
│   ├── creative-engine.ts     # Renderování bannerů
│   ├── export.ts              # Export (ZIP, CSV, JSON)
│   └── openai-client.ts       # OpenAI API wrapper
├── stores/
│   └── app-store.ts           # Zustand store
└── types/
    └── index.ts               # TypeScript typy
```

## 🔧 Technologie

- **React 18** + TypeScript
- **Vite** - build tool
- **Tailwind CSS** - styling
- **Zustand** - state management
- **Canvas API** - renderování bannerů
- **MediaRecorder API** - video slideshow

## 📖 Dokumentace zdrojů

- [Sklik bannery](https://napoveda.sklik.cz/pravidla/bannery/)
- [Sklik branding](https://napoveda.sklik.cz/pravidla/branding/)
- [Sklik interscroller](https://napoveda.sklik.cz/pravidla/interscroller/)
- [Google Ads P-Max](https://support.google.com/google-ads/answer/13676244)
- [Google Ads Display](https://support.google.com/google-ads/answer/1722096)

## 📄 License

MIT
