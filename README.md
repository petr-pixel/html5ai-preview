# AdCreative Studio Pro

AI-powered creative generator for **Sklik** and **Google Ads** campaigns.

## Features

- 🎨 **AI Image Generation** - DALL-E 3 / GPT-Image-1
- ✍️ **AI Copywriting** - Headlines, CTAs, descriptions
- 🎯 **Smart Crop** - GPT-4o Vision for optimal cropping
- 📊 **Competitor Analysis** - Analyze competitor websites
- 🎬 **All Ad Formats** - 60+ formats for Sklik & Google Ads
- 📦 **Bulk Export** - ZIP with folder structure + CSV for import

## Tech Stack

- Next.js 14 (Pages Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI (shadcn/ui style)
- Zustand (state management)
- OpenAI API

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)
5. Enter your OpenAI API key in Settings

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Deploy

No environment variables needed - API key is entered by user in the app.

## Supported Formats

### Sklik
- Bannery (11 sizes)
- HTML5 (6 sizes)
- Kombinovaná reklama
- Branding (with safe zone)
- Interscroller (with safe zone)
- Video (3 aspect ratios)

### Google Ads
- Display (13 sizes)
- Performance Max
- Demand Gen
- Responsive Display
- YouTube

## License

MIT
