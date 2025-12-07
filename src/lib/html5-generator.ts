/**
 * HTML5 Banner Generator
 * Vytváří animované HTML5 bannery s GSAP (whitelisted pro Sklik)
 */

import type { Html5Template, TextOverlay } from '@/types'

interface Html5Options {
  width: number
  height: number
  imageDataUrl: string
  text: TextOverlay
  template: Html5Template
  brandColors: {
    primary: string
    secondary: string
    accent: string
  }
  animationDuration?: number
  loop?: boolean
}

interface Html5Files {
  'index.html': string
  'styles.css': string
  'script.js': string
}

// GSAP CDN URL (whitelisted pro Sklik)
const GSAP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'

export function generateHtml5Banner(options: Html5Options): Html5Files {
  const {
    width,
    height,
    imageDataUrl,
    text,
    template,
    brandColors,
    animationDuration = 1,
    loop = true,
  } = options

  const fontSize = Math.min(width, height) * 0.08
  const ctaFontSize = fontSize * 0.6
  const padding = Math.min(width, height) * 0.05

  // Generate animation JS based on template
  const animations = getAnimationCode(template, animationDuration, loop)

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="ad.size" content="width=${width},height=${height}">
  <title>Banner ${width}x${height}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="banner" id="banner">
    <img src="image.jpg" alt="" class="background" id="background">
    
    <div class="content" id="content">
      ${text.showHeadline && text.headline ? `
      <div class="headline" id="headline">${escapeHtml(text.headline)}</div>
      ` : ''}
      
      ${text.showSubheadline && text.subheadline ? `
      <div class="subheadline" id="subheadline">${escapeHtml(text.subheadline)}</div>
      ` : ''}
      
      ${text.showCta && text.cta ? `
      <a href="javascript:void(0)" class="cta" id="cta">${escapeHtml(text.cta)}</a>
      ` : ''}
    </div>
  </div>
  
  <script src="${GSAP_CDN}"></script>
  <script src="script.js"></script>
</body>
</html>`

  const css = `/* Banner ${width}x${height} */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
}

.banner {
  width: ${width}px;
  height: ${height}px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  font-family: ${text.fontFamily};
  background: #f0f0f0;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  position: absolute;
  ${getPositionCSS(text.position, padding)}
  display: flex;
  flex-direction: column;
  ${getAlignmentCSS(text.position)}
  gap: ${padding * 0.5}px;
  max-width: ${width - padding * 2}px;
}

.headline {
  background: ${text.backgroundColor};
  color: ${text.color};
  padding: ${padding * 0.4}px ${padding * 0.8}px;
  font-size: ${fontSize}px;
  font-weight: bold;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subheadline {
  background: ${text.backgroundColor};
  color: ${text.color};
  padding: ${padding * 0.3}px ${padding * 0.6}px;
  font-size: ${fontSize * 0.6}px;
  line-height: 1.3;
}

.cta {
  display: inline-block;
  background: ${brandColors.accent};
  color: #ffffff;
  padding: ${padding * 0.4}px ${padding * 0.8}px;
  font-size: ${ctaFontSize}px;
  font-weight: bold;
  text-decoration: none;
  border-radius: 4px;
  text-align: center;
  transition: transform 0.2s, background 0.2s;
}

.cta:hover {
  background: ${adjustColor(brandColors.accent, -20)};
  transform: scale(1.05);
}

/* Initial states for animation */
.headline,
.subheadline,
.cta {
  opacity: 0;
}

.background {
  transform-origin: center center;
}`

  const js = `// Banner ${width}x${height}
// Click handling
var clickTag = "";

document.getElementById("banner").addEventListener("click", function(e) {
  if (clickTag && clickTag.length > 0) {
    window.open(clickTag, "_blank");
  }
});

// Wait for GSAP to load
function initAnimation() {
  if (typeof gsap === "undefined") {
    setTimeout(initAnimation, 100);
    return;
  }
  
  ${animations}
}

// Start when ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimation);
} else {
  initAnimation();
}`

  return {
    'index.html': html,
    'styles.css': css,
    'script.js': js,
  }
}

function getAnimationCode(template: Html5Template, duration: number, loop: boolean): string {
  const loopCode = loop ? `
  // Loop animation
  tl.eventCallback("onComplete", function() {
    setTimeout(function() {
      tl.restart();
    }, 2000);
  });` : ''

  switch (template) {
    case 'fade-in':
      return `
  var tl = gsap.timeline();
  
  // Background subtle zoom
  tl.from("#background", {
    scale: 1.1,
    duration: ${duration * 2},
    ease: "power1.out"
  }, 0);
  
  // Headline fade in
  tl.to("#headline", {
    opacity: 1,
    duration: ${duration * 0.8},
    ease: "power2.out"
  }, ${duration * 0.3});
  
  // Subheadline fade in
  tl.to("#subheadline", {
    opacity: 1,
    duration: ${duration * 0.6},
    ease: "power2.out"
  }, ${duration * 0.6});
  
  // CTA fade in with slight scale
  tl.to("#cta", {
    opacity: 1,
    scale: 1,
    duration: ${duration * 0.6},
    ease: "back.out(1.7)"
  }, ${duration * 0.9});
  
  // Set initial CTA scale
  gsap.set("#cta", { scale: 0.8 });
  ${loopCode}`

    case 'slide-up':
      return `
  var tl = gsap.timeline();
  
  // Background
  tl.from("#background", {
    scale: 1.05,
    duration: ${duration * 2},
    ease: "power1.out"
  }, 0);
  
  // Headline slide up
  tl.fromTo("#headline", {
    opacity: 0,
    y: 30
  }, {
    opacity: 1,
    y: 0,
    duration: ${duration * 0.7},
    ease: "power3.out"
  }, ${duration * 0.2});
  
  // Subheadline slide up
  tl.fromTo("#subheadline", {
    opacity: 0,
    y: 20
  }, {
    opacity: 1,
    y: 0,
    duration: ${duration * 0.6},
    ease: "power3.out"
  }, ${duration * 0.5});
  
  // CTA slide up
  tl.fromTo("#cta", {
    opacity: 0,
    y: 20
  }, {
    opacity: 1,
    y: 0,
    duration: ${duration * 0.6},
    ease: "power3.out"
  }, ${duration * 0.8});
  ${loopCode}`

    case 'pulse-cta':
      return `
  var tl = gsap.timeline();
  
  // Initial reveal
  tl.to("#headline", {
    opacity: 1,
    duration: ${duration * 0.5},
    ease: "power2.out"
  }, ${duration * 0.2});
  
  tl.to("#subheadline", {
    opacity: 1,
    duration: ${duration * 0.5},
    ease: "power2.out"
  }, ${duration * 0.4});
  
  tl.to("#cta", {
    opacity: 1,
    duration: ${duration * 0.5},
    ease: "power2.out"
  }, ${duration * 0.6});
  
  // CTA pulse animation (infinite)
  gsap.to("#cta", {
    scale: 1.05,
    duration: 0.6,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    delay: ${duration * 1.2}
  });`

    case 'zoom-in':
      return `
  var tl = gsap.timeline();
  
  // Background zoom
  tl.from("#background", {
    scale: 1.3,
    duration: ${duration * 1.5},
    ease: "power2.out"
  }, 0);
  
  // Content zoom in
  tl.fromTo("#headline", {
    opacity: 0,
    scale: 0.8
  }, {
    opacity: 1,
    scale: 1,
    duration: ${duration * 0.6},
    ease: "back.out(1.4)"
  }, ${duration * 0.4});
  
  tl.fromTo("#subheadline", {
    opacity: 0,
    scale: 0.9
  }, {
    opacity: 1,
    scale: 1,
    duration: ${duration * 0.5},
    ease: "power2.out"
  }, ${duration * 0.7});
  
  tl.fromTo("#cta", {
    opacity: 0,
    scale: 0.5
  }, {
    opacity: 1,
    scale: 1,
    duration: ${duration * 0.6},
    ease: "elastic.out(1, 0.5)"
  }, ${duration});
  ${loopCode}`

    case 'bounce':
      return `
  var tl = gsap.timeline();
  
  // Headline bounce in
  tl.fromTo("#headline", {
    opacity: 0,
    y: -50
  }, {
    opacity: 1,
    y: 0,
    duration: ${duration * 0.8},
    ease: "bounce.out"
  }, ${duration * 0.2});
  
  tl.to("#subheadline", {
    opacity: 1,
    duration: ${duration * 0.5},
    ease: "power2.out"
  }, ${duration * 0.6});
  
  // CTA bounce
  tl.fromTo("#cta", {
    opacity: 0,
    y: 30
  }, {
    opacity: 1,
    y: 0,
    duration: ${duration * 0.8},
    ease: "bounce.out"
  }, ${duration * 0.8});
  
  // Continuous CTA bounce
  gsap.to("#cta", {
    y: -5,
    duration: 0.4,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    delay: ${duration * 2}
  });`

    default:
      return getAnimationCode('fade-in', duration, loop)
  }
}

function getPositionCSS(position: string, padding: number): string {
  const positions: Record<string, string> = {
    'top-left': `top: ${padding}px; left: ${padding}px;`,
    'top-center': `top: ${padding}px; left: 50%; transform: translateX(-50%);`,
    'top-right': `top: ${padding}px; right: ${padding}px;`,
    'center': `top: 50%; left: 50%; transform: translate(-50%, -50%);`,
    'bottom-left': `bottom: ${padding}px; left: ${padding}px;`,
    'bottom-center': `bottom: ${padding}px; left: 50%; transform: translateX(-50%);`,
    'bottom-right': `bottom: ${padding}px; right: ${padding}px;`,
  }
  return positions[position] || positions['bottom-center']
}

function getAlignmentCSS(position: string): string {
  if (position.includes('center')) return 'align-items: center; text-align: center;'
  if (position.includes('right')) return 'align-items: flex-end; text-align: right;'
  return 'align-items: flex-start; text-align: left;'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function adjustColor(hex: string, amount: number): string {
  // Simple color adjustment
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Validace HTML5 banneru pro Sklik
 */
export function validateHtml5ForSklik(files: Html5Files): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const allContent = Object.values(files).join('\n')

  // Banned functions
  const banned = ['window.open', 'mraid.open', 'Enabler.exit', 'eval(', 'Function(']
  for (const fn of banned) {
    if (allContent.includes(fn)) {
      errors.push(`Zakázaná funkce: ${fn}`)
    }
  }

  // Check for video tag
  if (allContent.includes('<video')) {
    errors.push('Tag <video> není povolen')
  }

  // Check total size (rough estimate)
  const totalSize = new Blob([allContent]).size / 1024
  if (totalSize > 200) { // Leave room for image
    errors.push(`Kód je příliš velký: ${totalSize.toFixed(0)} kB (max ~200 kB bez obrázku)`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
