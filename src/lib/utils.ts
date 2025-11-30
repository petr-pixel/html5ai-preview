import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  limit: number
) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Vykreslí zaoblený obdélník - kompatibilní se staršími prohlížeči
 * Nahrazuje ctx.roundRect() který není všude podporován
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl: number; tr: number; br: number; bl: number }
): void {
  const r = typeof radius === 'number' 
    ? { tl: radius, tr: radius, br: radius, bl: radius }
    : radius

  // Omez radius na max polovinu menší strany
  const maxR = Math.min(width / 2, height / 2)
  r.tl = Math.min(r.tl, maxR)
  r.tr = Math.min(r.tr, maxR)
  r.br = Math.min(r.br, maxR)
  r.bl = Math.min(r.bl, maxR)

  ctx.beginPath()
  ctx.moveTo(x + r.tl, y)
  ctx.lineTo(x + width - r.tr, y)
  ctx.arcTo(x + width, y, x + width, y + r.tr, r.tr)
  ctx.lineTo(x + width, y + height - r.br)
  ctx.arcTo(x + width, y + height, x + width - r.br, y + height, r.br)
  ctx.lineTo(x + r.bl, y + height)
  ctx.arcTo(x, y + height, x, y + height - r.bl, r.bl)
  ctx.lineTo(x, y + r.tl)
  ctx.arcTo(x, y, x + r.tl, y, r.tl)
  ctx.closePath()
}
