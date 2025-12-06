import { useState, useEffect, useRef } from 'react'
import { Button, Card } from '@/components/ui'
import { Play, Pause, RotateCcw } from 'lucide-react'
import type { Format, TextOverlay } from '@/types'

export interface HTML5PreviewProps {
  key?: number | string
  format: Format
  imageUrl: string
  textOverlay: TextOverlay
  isPMax?: boolean
}

export function HTML5Preview({ format, imageUrl, textOverlay, isPMax }: HTML5PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [scale, setScale] = useState(1)

  const generateHTML5 = () => {
    const metaTags = isPMax
      ? '<meta name="productType" content="dynamic"><meta name="vertical" content="RETAIL">'
      : ''

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="ad.size" content="width=${format.width},height=${format.height}">
${metaTags}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  width: ${format.width}px; 
  height: ${format.height}px; 
  overflow: hidden; 
  font-family: 'Inter', system-ui, sans-serif;
}
.banner {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}
.bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: zoomIn 8s ease-out forwards;
}
.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%);
}
.content {
  position: absolute;
  ${textOverlay.position.includes('top') ? 'top: 20px' : 'bottom: 20px'};
  ${textOverlay.position.includes('left') ? 'left: 20px; text-align: left' : 
    textOverlay.position.includes('right') ? 'right: 20px; text-align: right' : 
    'left: 50%; transform: translateX(-50%); text-align: center'};
  color: white;
  max-width: 90%;
}
.headline {
  font-size: ${Math.max(16, Math.min(format.width / 12, 42))}px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.8);
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s ease-out 0.3s forwards;
  line-height: 1.2;
}
.subheadline {
  font-size: ${Math.max(12, Math.min(format.width / 20, 22))}px;
  margin-bottom: 14px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s ease-out 0.5s forwards;
  opacity: 0.9;
}
.cta {
  display: inline-block;
  background: ${textOverlay.ctaColor};
  color: white;
  padding: ${Math.max(8, format.height / 25)}px ${Math.max(16, format.width / 15)}px;
  border-radius: 8px;
  font-size: ${Math.max(12, Math.min(format.width / 25, 18))}px;
  font-weight: 600;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s ease-out 0.7s forwards;
  transition: transform 0.2s, box-shadow 0.2s;
}
.cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
}
@keyframes zoomIn {
  from { transform: scale(1.1); }
  to { transform: scale(1); }
}
@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}
</style>
</head>
<body>
<div class="banner" onclick="window.open(window.clickTag || '#')">
  <img class="bg" src="${imageUrl}" alt="">
  <div class="overlay"></div>
  <div class="content">
    ${textOverlay.headline ? `<div class="headline">${textOverlay.headline}</div>` : ''}
    ${textOverlay.subheadline ? `<div class="subheadline">${textOverlay.subheadline}</div>` : ''}
    ${textOverlay.cta ? `<div class="cta">${textOverlay.cta}</div>` : ''}
  </div>
</div>
<script>var clickTag = "";</script>
</body>
</html>`
  }

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(generateHTML5())
        doc.close()
      }
    }
  }, [format, imageUrl, textOverlay, isPlaying])

  // Calculate scale to fit preview
  useEffect(() => {
    const maxWidth = 400
    const maxHeight = 300
    const scaleX = maxWidth / format.width
    const scaleY = maxHeight / format.height
    setScale(Math.min(scaleX, scaleY, 1))
  }, [format])

  const restart = () => {
    setIsPlaying(false)
    setTimeout(() => setIsPlaying(true), 50)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-sm">{format.name}</h4>
          <p className="text-xs text-muted-foreground font-mono">
            {format.width} × {format.height}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={restart}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div 
        className="bg-background rounded-lg overflow-hidden border border-border flex items-center justify-center"
        style={{ 
          width: format.width * scale,
          height: format.height * scale,
          margin: '0 auto'
        }}
      >
        {isPlaying && (
          <iframe
            ref={iframeRef}
            title="HTML5 Preview"
            style={{
              width: format.width,
              height: format.height,
              border: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        )}
      </div>
    </Card>
  )
}
