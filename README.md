# AdCreative Studio

Generátor reklamních kreativ pro **Sklik** a **Google Ads**.

## 🚀 Funkce

- **Generování obrázků** z promptu (OpenAI gpt-image-1)
- **Upload vlastního obrázku**
- **Smart Crop** s AI detekcí (GPT-4o Vision)
- **Text overlay** (headline, CTA) s AI generováním
- **Brand Kit** - automatická extrakce z vašeho webu
- **Konkurenční analýza** - AI analýza konkurence
- **Všechny formáty** Sklik i Google Ads
- **HTML5 bannery** s animacemi (GSAP)
- **Video** (Slideshow + Sora)
- **Export ZIP** se strukturou složek
- **Validace** rozměrů a velikostí

## 📦 Formáty

### Sklik
- Bannery (11 formátů)
- HTML5 (6 formátů)
- Kombinovaná reklama (4 formáty)
- Branding (se safe zone)
- Interscroller
- Video (16:9, 9:16, 1:1)

### Google Ads
- Display (13 formátů)
- Performance Max (5 formátů)
- Demand Gen (3 formáty)
- Responsive Display (4 formáty)
- YouTube Video

## 🛠️ Instalace

### Požadavky
- OpenAI API klíč ([platform.openai.com](https://platform.openai.com/api-keys))
- GitHub účet
- Vercel účet (zdarma)

### Postup

1. **Stáhni ZIP** a rozbal

2. **Nahraj na GitHub**
   - Jdi na [github.com/new](https://github.com/new)
   - Vytvoř nový repository
   - Přetáhni soubory do repository

3. **Propoj s Vercel**
   - Jdi na [vercel.com](https://vercel.com)
   - Klikni "Import Project"
   - Vyber svůj GitHub repository
   - Klikni "Deploy"

4. **Hotovo!**
   - Dostaneš URL jako `tvuj-projekt.vercel.app`
   - Otevři a zadej OpenAI API klíč v Nastavení

## 💰 Náklady

| Služba | Cena |
|--------|------|
| Vercel hosting | Zdarma |
| OpenAI - obrázek | $0.04/img |
| OpenAI - text | $0.001/req |
| OpenAI - smart crop | $0.01/img |
| OpenAI - video (Sora) | $0.10/s |

**Typická session: ~$0.15**

## 🔧 Vlastní doména

1. V Vercel dashboard → Settings → Domains
2. Přidej svou doménu (např. `html5ai.cz`)
3. Nastav DNS záznamy podle instrukcí

## 📁 Struktura projektu

```
src/
├── app/
│   ├── api/
│   │   ├── generate/      # AI generování
│   │   ├── brand-extract/ # Brand Kit
│   │   ├── analyze/       # Konkurence
│   │   └── smart-crop/    # AI crop
│   ├── page.tsx           # Hlavní stránka
│   └── layout.tsx
├── components/
│   ├── Header.tsx
│   ├── InputPanel.tsx
│   ├── FormatSelector.tsx
│   ├── CreativeEditor.tsx
│   └── ExportPanel.tsx
├── lib/
│   └── formats.ts         # Definice formátů
├── stores/
│   └── app-store.ts       # Zustand state
└── types/
    └── index.ts
```

## 📖 Zdroje formátů

- [Sklik - Bannery](https://napoveda.sklik.cz/pravidla/bannery/)
- [Sklik - HTML5](https://napoveda.sklik.cz/pravidla/html5-bannery/)
- [Sklik - Branding](https://napoveda.sklik.cz/pravidla/branding/)
- [Google Ads - Display](https://support.google.com/google-ads/answer/1722096)
- [Google Ads - P-Max](https://support.google.com/google-ads/answer/13676244)

## 🐛 Řešení problémů

### "API klíč není zadán"
→ Klikni na Nastavení (vpravo nahoře) a zadej OpenAI API klíč

### "Chyba při generování"
→ Zkontroluj, že máš kredit na OpenAI účtu

### Obrázky se negenerují
→ Některé prompty mohou být blokovány content policy. Zkus upravit prompt.

## 📄 Licence

MIT
