import { loadImage, drawRoundedRect } from '@/lib/utils'
import type { TextOverlay } from '@/types'

export function drawTextOverlay(
    ctx: CanvasRenderingContext2D,
    overlay: TextOverlay,
    width: number,
    height: number,
    brandKit?: { ctaColor?: string; headlineFont?: string; textColor?: string },
    perFormatSettings?: { fontSizeMultiplier?: number; hideHeadline?: boolean; hideSubheadline?: boolean; hideCta?: boolean; customPosition?: string }
) {
    if (!overlay.headline && !overlay.subheadline && !overlay.cta) {
        return
    }

    // Per-format overrides
    const fontSizeMultiplier = perFormatSettings?.fontSizeMultiplier || 1.0
    const hideHeadline = perFormatSettings?.hideHeadline || false
    const hideSubheadline = perFormatSettings?.hideSubheadline || false
    const hideCta = perFormatSettings?.hideCta || false
    const positionOverride = perFormatSettings?.customPosition

    const aspectRatio = width / height
    const isWide = aspectRatio > 3  // Leaderboard 728x90, Billboard 970x90
    const isSemiWide = aspectRatio > 2 && aspectRatio <= 3  // 970x250, 970x310
    const isTall = aspectRatio < 0.6  // Skyscraper 160x600, Half Page 300x600
    const isSemiTall = aspectRatio >= 0.6 && aspectRatio < 0.8  // 300x250 ish
    const isSmall = width <= 320 || height <= 100
    const isVerySmall = width <= 200 || height <= 60

    const padding = Math.max(8, Math.min(width, height) * 0.05)
    const fontFamily = brandKit?.headlineFont || 'Arial, Helvetica, sans-serif'
    const textColor = brandKit?.textColor || '#ffffff'
    const ctaColor = overlay.ctaColor || brandKit?.ctaColor || '#ff6600'

    // Dynamické velikosti fontů podle formátu
    const sizeMultipliers = {
        small: { headline: 0.14, sub: 0.10, cta: 0.09 },
        medium: { headline: 0.18, sub: 0.12, cta: 0.10 },
        large: { headline: 0.22, sub: 0.14, cta: 0.12 },
    }
    const mult = sizeMultipliers[overlay.fontSize] || sizeMultipliers.medium

    let headlineSize: number
    let subSize: number
    let ctaSize: number

    if (isVerySmall) {
        headlineSize = Math.min(height * 0.35, width * 0.08)
        subSize = 0
        ctaSize = Math.min(height * 0.25, width * 0.06)
    } else if (isWide) {
        headlineSize = height * 0.32 * (mult.headline / 0.18)
        subSize = height * 0.20 * (mult.sub / 0.12)
        ctaSize = height * 0.22 * (mult.cta / 0.10)
    } else if (isSemiWide) {
        headlineSize = Math.min(height * 0.15, width * 0.035) * (mult.headline / 0.18)
        subSize = Math.min(height * 0.10, width * 0.025) * (mult.sub / 0.12)
        ctaSize = Math.min(height * 0.10, width * 0.022) * (mult.cta / 0.10)
    } else if (isTall) {
        headlineSize = width * 0.14 * (mult.headline / 0.18)
        subSize = width * 0.09 * (mult.sub / 0.12)
        ctaSize = width * 0.10 * (mult.cta / 0.10)
    } else if (isSmall) {
        headlineSize = Math.min(height * 0.28, width * 0.07)
        subSize = Math.min(height * 0.18, width * 0.045)
        ctaSize = Math.min(height * 0.20, width * 0.05)
    } else {
        const base = Math.min(width, height)
        headlineSize = base * mult.headline
        subSize = base * mult.sub
        ctaSize = base * mult.cta
    }

    headlineSize *= fontSizeMultiplier
    subSize *= fontSizeMultiplier
    ctaSize *= fontSizeMultiplier

    headlineSize = Math.max(10, Math.min(headlineSize, 56))
    subSize = Math.max(8, Math.min(subSize, 32))
    ctaSize = Math.max(8, Math.min(ctaSize, 24))

    const showHeadline = !isVerySmall && overlay.headline && !hideHeadline
    const showSubheadline = !isSmall && !isWide && overlay.subheadline && !hideSubheadline
    const showCta = overlay.cta && ctaSize >= 8 && !hideCta

    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
        ctx.font = `bold ${fontSize}px ${fontFamily}`
        const words = text.split(' ')
        const lines: string[] = []
        let line = ''

        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word
            if (ctx.measureText(testLine).width > maxWidth && line) {
                lines.push(line)
                line = word
            } else {
                line = testLine
            }
        }
        if (line) lines.push(line)
        return lines
    }

    const maxTextWidth = width - padding * 2

    const headlineLines = showHeadline ? wrapText(overlay.headline, maxTextWidth, headlineSize) : []
    const subLines = showSubheadline ? wrapText(overlay.subheadline!, maxTextWidth, subSize) : []

    let blockHeight = 0
    if (headlineLines.length) blockHeight += headlineLines.length * headlineSize * 1.15 + 4
    if (subLines.length) blockHeight += subLines.length * subSize * 1.15 + 4
    if (showCta) blockHeight += ctaSize * 2.2

    const position = positionOverride || overlay.position || 'bottom-left'
    let x = padding
    let startY = padding
    let align: CanvasTextAlign = 'left'

    if (position.includes('right')) {
        x = width - padding
        align = 'right'
    } else if (position.includes('center') || position === 'center') {
        x = width / 2
        align = 'center'
    }

    if (position.includes('bottom')) {
        startY = height - padding - blockHeight
    } else if (position === 'center') {
        startY = (height - blockHeight) / 2
    }

    startY = Math.max(padding / 2, Math.min(startY, height - blockHeight - padding / 2))

    ctx.textAlign = align
    ctx.textBaseline = 'top'
    let currentY = startY

    if (headlineLines.length > 0) {
        ctx.font = `bold ${Math.round(headlineSize)}px ${fontFamily}`
        ctx.fillStyle = textColor
        if (overlay.shadow?.enabled) {
            ctx.shadowColor = overlay.shadow.color
            ctx.shadowBlur = overlay.shadow.blur
            ctx.shadowOffsetX = overlay.shadow.offsetX
            ctx.shadowOffsetY = overlay.shadow.offsetY
        } else {
            // Default legacy shadow
            ctx.shadowColor = 'rgba(0,0,0,0.8)'
            ctx.shadowBlur = Math.max(2, headlineSize * 0.08)
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
        }

        for (const line of headlineLines) {
            ctx.fillText(line, x, currentY)
            currentY += headlineSize * 1.15
        }
        currentY += 4
    }

    if (subLines.length > 0) {
        ctx.font = `${Math.round(subSize)}px ${fontFamily}`
        ctx.fillStyle = textColor
        if (overlay.shadow?.enabled) {
            ctx.shadowColor = overlay.shadow.color
            ctx.shadowBlur = overlay.shadow.blur
            ctx.shadowOffsetX = overlay.shadow.offsetX
            ctx.shadowOffsetY = overlay.shadow.offsetY
        } else {
            // Default legacy shadow
            ctx.shadowColor = 'rgba(0,0,0,0.6)'
            ctx.shadowBlur = Math.max(1, subSize * 0.06)
        }

        for (const line of subLines) {
            ctx.fillText(line, x, currentY)
            currentY += subSize * 1.15
        }
        currentY += 4
    }

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    if (showCta && overlay.cta) {
        ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
        let ctaText = overlay.cta
        let ctaTextWidth = ctx.measureText(ctaText).width

        const maxCtaTextWidth = maxTextWidth - ctaSize * 1.2
        if (ctaTextWidth > maxCtaTextWidth) {
            const scaleFactor = maxCtaTextWidth / ctaTextWidth
            ctaSize = Math.max(8, ctaSize * scaleFactor)
            ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
            ctaTextWidth = ctx.measureText(ctaText).width
        }

        const ctaPaddingX = Math.max(ctaSize * 0.5, 6)
        const ctaPaddingY = Math.max(ctaSize * 0.3, 4)
        const ctaWidth = ctaTextWidth + ctaPaddingX * 2
        const ctaHeight = ctaSize + ctaPaddingY * 2
        const ctaRadius = Math.min(ctaHeight / 2.5, 6)

        let ctaX = x
        if (align === 'center') {
            ctaX = x - ctaWidth / 2
        } else if (align === 'right') {
            ctaX = x - ctaWidth
        }

        ctaX = Math.max(padding / 2, Math.min(ctaX, width - ctaWidth - padding / 2))
        const ctaY = Math.min(currentY, height - ctaHeight - padding / 2)

        ctx.fillStyle = ctaColor
        drawRoundedRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaRadius)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ctaText, ctaX + ctaWidth / 2, ctaY + ctaHeight / 2)
    }

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
}

export async function drawWatermark(
    ctx: CanvasRenderingContext2D,
    watermark: { image: string | null; opacity: number; size: number; position: string },
    width: number,
    height: number
) {
    if (!watermark.image) return

    try {
        const img = await loadImage(watermark.image)
        const maxSize = Math.min(width, height) * (watermark.size / 100)
        const ratio = img.width / img.height
        const w = ratio > 1 ? maxSize : maxSize * ratio
        const h = ratio > 1 ? maxSize / ratio : maxSize

        let x = 0
        let y = 0
        const margin = Math.min(width, height) * 0.03

        switch (watermark.position) {
            case 'top-left':
                x = margin
                y = margin
                break
            case 'top-right':
                x = width - w - margin
                y = margin
                break
            case 'bottom-left':
                x = margin
                y = height - h - margin
                break
            case 'bottom-right':
                x = width - w - margin
                y = height - h - margin
                break
            case 'center':
                x = (width - w) / 2
                y = (height - h) / 2
                break
        }

        ctx.globalAlpha = watermark.opacity
        ctx.drawImage(img, x, y, w, h)
        ctx.globalAlpha = 1
    } catch (err) {
        console.error('Watermark error:', err)
    }
}
