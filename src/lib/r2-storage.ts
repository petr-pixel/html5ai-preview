/**
 * Cloudflare R2 Storage Client
 * 
 * S3-compatible storage pro ukládání kreativ a videí.
 * Free tier: 10 GB storage, 10M downloads/měsíc, ZDARMA egress
 * 
 * LIMIT: 9 GB (rezerva 1 GB)
 */

// R2 konfigurace
export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl?: string
}

// Storage stats
export interface R2StorageStats {
  usedBytes: number
  usedGB: number
  limitGB: number
  remainingGB: number
  percentUsed: number
  isNearLimit: boolean // > 80%
  isOverLimit: boolean // > 100%
}

// Výsledek uploadu
export interface UploadResult {
  success: boolean
  key: string
  url: string
  size: number
  error?: string
}

// LIMIT: 9 GB (v bytes)
export const R2_STORAGE_LIMIT_GB = 9
export const R2_STORAGE_LIMIT_BYTES = R2_STORAGE_LIMIT_GB * 1024 * 1024 * 1024

// Local storage key pro tracking velikosti
const STORAGE_STATS_KEY = 'r2-storage-stats'

/**
 * Získá aktuální storage stats z localStorage
 */
export function getStorageStats(): R2StorageStats {
  try {
    const stored = localStorage.getItem(STORAGE_STATS_KEY)
    const usedBytes = stored ? parseInt(stored, 10) : 0
    const usedGB = usedBytes / (1024 * 1024 * 1024)
    const remainingGB = R2_STORAGE_LIMIT_GB - usedGB
    const percentUsed = (usedBytes / R2_STORAGE_LIMIT_BYTES) * 100
    
    return {
      usedBytes,
      usedGB: Math.round(usedGB * 100) / 100,
      limitGB: R2_STORAGE_LIMIT_GB,
      remainingGB: Math.round(remainingGB * 100) / 100,
      percentUsed: Math.round(percentUsed * 10) / 10,
      isNearLimit: percentUsed > 80,
      isOverLimit: percentUsed >= 100,
    }
  } catch {
    return {
      usedBytes: 0,
      usedGB: 0,
      limitGB: R2_STORAGE_LIMIT_GB,
      remainingGB: R2_STORAGE_LIMIT_GB,
      percentUsed: 0,
      isNearLimit: false,
      isOverLimit: false,
    }
  }
}

/**
 * Aktualizuje storage stats
 */
export function updateStorageStats(addedBytes: number): R2StorageStats {
  const current = getStorageStats()
  const newUsedBytes = current.usedBytes + addedBytes
  localStorage.setItem(STORAGE_STATS_KEY, newUsedBytes.toString())
  return getStorageStats()
}

/**
 * Resetuje storage stats (např. po manuálním vyčištění bucketu)
 */
export function resetStorageStats(): void {
  localStorage.setItem(STORAGE_STATS_KEY, '0')
}

/**
 * Kontroluje zda je místo pro upload
 */
export function canUpload(fileSize: number): { canUpload: boolean; reason?: string } {
  const stats = getStorageStats()
  
  if (stats.isOverLimit) {
    return { 
      canUpload: false, 
      reason: `Storage limit překročen (${stats.usedGB}/${stats.limitGB} GB). Smažte nějaké soubory.` 
    }
  }
  
  const newUsedBytes = stats.usedBytes + fileSize
  if (newUsedBytes > R2_STORAGE_LIMIT_BYTES) {
    const fileSizeMB = Math.round(fileSize / (1024 * 1024) * 10) / 10
    return { 
      canUpload: false, 
      reason: `Nedostatek místa. Soubor: ${fileSizeMB} MB, volno: ${stats.remainingGB} GB` 
    }
  }
  
  return { canUpload: true }
}

/**
 * Konvertuje data URL na Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  
  return new Blob([array], { type: mime })
}

/**
 * Upload souboru do R2 přes signed URL nebo direct
 * 
 * POZOR: Pro browser upload potřebujeme CORS policy na bucketu
 * nebo backend proxy. Tato verze používá přímý PUT.
 */
export async function uploadToR2(
  config: R2Config,
  file: Blob,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<UploadResult> {
  // Kontrola limitu
  const canUploadResult = canUpload(file.size)
  if (!canUploadResult.canUpload) {
    return {
      success: false,
      key,
      url: '',
      size: 0,
      error: canUploadResult.reason,
    }
  }

  try {
    const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`
    const url = `${endpoint}/${config.bucketName}/${key}`
    
    // Pro direct upload potřebujeme AWS Signature V4
    // Prozatím používáme jednodušší přístup - předpokládáme public bucket
    // nebo CORS enabled bucket
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
      mode: 'cors',
    })
    
    if (!response.ok) {
      // Pokud direct upload nefunguje, vrátíme fallback na local storage
      console.warn('R2 direct upload failed, using local storage fallback')
      return {
        success: false,
        key,
        url: '',
        size: 0,
        error: `Upload failed: ${response.status}. Možná chybí CORS policy.`,
      }
    }
    
    // Aktualizovat storage stats
    updateStorageStats(file.size)
    
    // Public URL pro přístup k souboru
    const publicUrl = config.publicUrl 
      ? `${config.publicUrl}/${key}`
      : `${endpoint}/${config.bucketName}/${key}`
    
    return {
      success: true,
      key,
      url: publicUrl,
      size: file.size,
    }
  } catch (error) {
    console.error('R2 upload error:', error)
    return {
      success: false,
      key,
      url: '',
      size: 0,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Upload kreativy (obrázek) do R2
 */
export async function uploadCreativeToR2(
  config: R2Config,
  imageDataUrl: string,
  filename: string
): Promise<UploadResult> {
  const blob = dataUrlToBlob(imageDataUrl)
  const contentType = imageDataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
  const key = `creatives/${Date.now()}-${filename}`
  
  return uploadToR2(config, blob, key, contentType)
}

/**
 * Upload videa do R2
 */
export async function uploadVideoToR2(
  config: R2Config,
  videoBlob: Blob,
  filename: string
): Promise<UploadResult> {
  const key = `videos/${Date.now()}-${filename}`
  return uploadToR2(config, videoBlob, key, 'video/webm')
}

/**
 * Generuje unikátní název souboru
 */
export function generateUniqueFilename(
  platform: string,
  width: number,
  height: number,
  extension: string = 'png'
): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${platform}_${width}x${height}_${timestamp}_${random}.${extension}`
}

/**
 * Kontroluje zda je R2 nakonfigurováno
 */
export function isR2Configured(config: Partial<R2Config> | null): config is R2Config {
  return !!(
    config &&
    config.accountId &&
    config.accessKeyId &&
    config.secretAccessKey &&
    config.bucketName
  )
}

/**
 * Batch upload kreativ do R2
 * Vrací kreativy s aktualizovanými URL (R2 místo data URL)
 */
export async function uploadCreativesToR2Batch(
  config: R2Config,
  creatives: Array<{
    id: string
    imageUrl: string
    videoUrl?: string
    isVideo?: boolean
    platform: string
    format: { width: number; height: number }
  }>,
  onProgress?: (uploaded: number, total: number) => void
): Promise<Array<{ id: string; imageUrl: string; videoUrl?: string; uploadedToR2: boolean }>> {
  const results: Array<{ id: string; imageUrl: string; videoUrl?: string; uploadedToR2: boolean }> = []
  
  for (let i = 0; i < creatives.length; i++) {
    const creative = creatives[i]
    onProgress?.(i, creatives.length)
    
    // Skip if already R2 URL
    if (creative.imageUrl.startsWith('https://') && creative.imageUrl.includes('r2.cloudflarestorage.com')) {
      results.push({ 
        id: creative.id, 
        imageUrl: creative.imageUrl, 
        videoUrl: creative.videoUrl,
        uploadedToR2: true 
      })
      continue
    }
    
    // Skip if not data URL (external URL)
    if (!creative.imageUrl.startsWith('data:')) {
      results.push({ 
        id: creative.id, 
        imageUrl: creative.imageUrl, 
        videoUrl: creative.videoUrl,
        uploadedToR2: false 
      })
      continue
    }
    
    try {
      // Upload image/thumbnail
      const filename = generateUniqueFilename(
        creative.platform,
        creative.format.width,
        creative.format.height,
        creative.isVideo ? 'jpg' : 'png'
      )
      
      const uploadResult = await uploadCreativeToR2(config, creative.imageUrl, filename)
      
      if (uploadResult.success) {
        let videoUrl = creative.videoUrl
        
        // Upload video if present
        if (creative.isVideo && creative.videoUrl && creative.videoUrl.startsWith('data:')) {
          const videoFilename = generateUniqueFilename(
            creative.platform,
            creative.format.width,
            creative.format.height,
            'webm'
          )
          const videoBlob = dataUrlToBlob(creative.videoUrl)
          const videoUploadResult = await uploadVideoToR2(config, videoBlob, videoFilename)
          
          if (videoUploadResult.success) {
            videoUrl = videoUploadResult.url
          }
        }
        
        results.push({ 
          id: creative.id, 
          imageUrl: uploadResult.url,
          videoUrl,
          uploadedToR2: true 
        })
      } else {
        // Upload failed, keep original data URL
        console.warn(`R2 upload failed for ${creative.id}:`, uploadResult.error)
        results.push({ 
          id: creative.id, 
          imageUrl: creative.imageUrl, 
          videoUrl: creative.videoUrl,
          uploadedToR2: false 
        })
      }
    } catch (error) {
      console.error(`R2 upload error for ${creative.id}:`, error)
      results.push({ 
        id: creative.id, 
        imageUrl: creative.imageUrl, 
        videoUrl: creative.videoUrl,
        uploadedToR2: false 
      })
    }
  }
  
  onProgress?.(creatives.length, creatives.length)
  return results
}

/**
 * Formátuje velikost v bytes na čitelný string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Defaultní R2 konfigurace (prázdná)
 */
export const defaultR2Config: R2Config = {
  accountId: '',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  publicUrl: '',
}
