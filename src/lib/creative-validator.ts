/**
 * Creative Validator
 * 
 * Kontroluje kreativy na běžné problémy:
 * - Zbytkové placeholdery (%DATE%, %DISCOUNT%, etc.)
 * - Překročení velikosti souboru
 * - Text overflow (odhad podle délky)
 */

import type { Creative } from '@/types'

export type ValidationStatus = 'ok' | 'warning' | 'error'

export interface CreativeValidation {
  status: ValidationStatus
  issues: ValidationIssue[]
}

export interface ValidationIssue {
  type: 'placeholder' | 'filesize' | 'text_overflow' | 'dimension' | 'safe_zone'
  severity: 'warning' | 'error'
  message: string
  field?: string
}

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  { pattern: /%DATE%/gi, name: 'DATE' },
  { pattern: /%DISCOUNT%/gi, name: 'DISCOUNT' },
  { pattern: /%PRICE%/gi, name: 'PRICE' },
  { pattern: /%PRODUCT%/gi, name: 'PRODUCT' },
  { pattern: /%BRAND%/gi, name: 'BRAND' },
  { pattern: /%CTA%/gi, name: 'CTA' },
  { pattern: /%[A-Z_]+%/gi, name: 'UNKNOWN' },
]

// Max file sizes by platform (in KB)
const MAX_FILE_SIZES: Record<string, number> = {
  'sklik-bannery': 150,
  'sklik-kombinovana': 2048,
  'sklik-branding': 200,
  'google-display': 150,
  'google-pmax': 5120,
  'google-youtube': 5120,
  'google-demand-gen': 5120,
  'default': 150,
}

// Recommended max text lengths by format width
const TEXT_LENGTH_LIMITS: Record<number, { headline: number; subheadline: number }> = {
  300: { headline: 25, subheadline: 40 },
  320: { headline: 25, subheadline: 40 },
  336: { headline: 30, subheadline: 45 },
  480: { headline: 35, subheadline: 50 },
  728: { headline: 50, subheadline: 70 },
  970: { headline: 60, subheadline: 80 },
  1200: { headline: 40, subheadline: 60 },
  1920: { headline: 50, subheadline: 70 },
}

/**
 * Validates a single creative
 */
export function validateCreative(creative: Creative): CreativeValidation {
  const issues: ValidationIssue[] = []

  // 1. Check for placeholder patterns in image data (if it's a data URL with text)
  // We can't really check the image content, but we check the format name and any metadata
  
  // 2. Check file size
  const maxSize = getMaxFileSize(creative.platform, creative.category)
  if (creative.sizeKB && creative.sizeKB > maxSize) {
    issues.push({
      type: 'filesize',
      severity: 'error',
      message: `Velikost ${creative.sizeKB} KB překračuje limit ${maxSize} KB`,
    })
  } else if (creative.sizeKB && creative.sizeKB > maxSize * 0.9) {
    issues.push({
      type: 'filesize',
      severity: 'warning',
      message: `Velikost ${creative.sizeKB} KB je blízko limitu ${maxSize} KB`,
    })
  }

  // 3. Check dimensions match format
  // (This would require loading the image, skip for now)

  // 4. Check if it's a branding format without safe zone consideration
  if (creative.category === 'branding' || creative.category === 'sklik-branding') {
    // Could add safe zone validation here
  }

  // 5. Check validation errors from generation
  if (creative.validationErrors && creative.validationErrors.length > 0) {
    creative.validationErrors.forEach(err => {
      issues.push({
        type: 'placeholder',
        severity: 'error',
        message: err,
      })
    })
  }

  // Determine overall status
  let status: ValidationStatus = 'ok'
  if (issues.some(i => i.severity === 'error')) {
    status = 'error'
  } else if (issues.some(i => i.severity === 'warning')) {
    status = 'warning'
  }

  return { status, issues }
}

/**
 * Validates text content for placeholders
 */
export function validateText(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const { pattern, name } of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) {
      issues.push({
        type: 'placeholder',
        severity: 'error',
        message: `Nevyplněný placeholder %${name}%`,
        field: 'text',
      })
    }
  }

  return issues
}

/**
 * Validates text length for a given format width
 */
export function validateTextLength(
  headline: string,
  subheadline: string,
  formatWidth: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Find closest width bracket
  const widths = Object.keys(TEXT_LENGTH_LIMITS).map(Number).sort((a, b) => a - b)
  const closestWidth = widths.reduce((prev, curr) => 
    Math.abs(curr - formatWidth) < Math.abs(prev - formatWidth) ? curr : prev
  )
  
  const limits = TEXT_LENGTH_LIMITS[closestWidth] || { headline: 40, subheadline: 60 }

  if (headline.length > limits.headline) {
    issues.push({
      type: 'text_overflow',
      severity: 'warning',
      message: `Headline má ${headline.length} znaků (doporučeno max ${limits.headline})`,
      field: 'headline',
    })
  }

  if (subheadline.length > limits.subheadline) {
    issues.push({
      type: 'text_overflow',
      severity: 'warning',
      message: `Subheadline má ${subheadline.length} znaků (doporučeno max ${limits.subheadline})`,
      field: 'subheadline',
    })
  }

  return issues
}

/**
 * Gets max file size for platform/category combo
 */
function getMaxFileSize(platform: string, category: string): number {
  const key = `${platform}-${category}`
  return MAX_FILE_SIZES[key] || MAX_FILE_SIZES['default']
}

/**
 * Batch validate multiple creatives
 */
export function validateCreatives(creatives: Creative[]): Map<string, CreativeValidation> {
  const results = new Map<string, CreativeValidation>()
  
  for (const creative of creatives) {
    results.set(creative.id, validateCreative(creative))
  }
  
  return results
}

/**
 * Get validation summary stats
 */
export function getValidationSummary(validations: Map<string, CreativeValidation>): {
  ok: number
  warnings: number
  errors: number
  total: number
} {
  let ok = 0
  let warnings = 0
  let errors = 0

  validations.forEach(v => {
    if (v.status === 'ok') ok++
    else if (v.status === 'warning') warnings++
    else if (v.status === 'error') errors++
  })

  return { ok, warnings, errors, total: validations.size }
}

/**
 * Status icon component helper
 */
export function getStatusIcon(status: ValidationStatus): {
  icon: '✓' | '⚠' | '✕'
  color: string
  bgColor: string
} {
  switch (status) {
    case 'ok':
      return { icon: '✓', color: 'text-green-600', bgColor: 'bg-green-100' }
    case 'warning':
      return { icon: '⚠', color: 'text-amber-600', bgColor: 'bg-amber-100' }
    case 'error':
      return { icon: '✕', color: 'text-red-600', bgColor: 'bg-red-100' }
  }
}
