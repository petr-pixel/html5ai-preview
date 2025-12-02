/**
 * Outpaint Module Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockFetchSuccess, mockFetchError } from './setup'

// Mock canvas a Image
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn().mockReturnValue({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
    globalCompositeOperation: '',
    filter: '',
    clearRect: vi.fn(),
  }),
  toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
  toBlob: vi.fn().mockImplementation((cb) => cb(new Blob(['test']))),
}

vi.spyOn(document, 'createElement').mockImplementation((tag) => {
  if (tag === 'canvas') return mockCanvas as any
  return document.createElement(tag)
})

describe('Outpaint Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkNeedsOutpainting', () => {
    it('should detect when outpainting is needed', async () => {
      const { checkNeedsOutpainting } = await import('../lib/outpaint')
      
      // Landscape image -> square format = needs outpaint
      const result = checkNeedsOutpainting(
        1920, 1080,  // source: landscape
        300, 300,    // target: square
        { x: 0, y: 0 }
      )
      
      expect(result.needsOutpaint).toBe(true)
    })

    it('should not need outpainting when image covers target', async () => {
      const { checkNeedsOutpainting } = await import('../lib/outpaint')
      
      // Large image -> small target
      const result = checkNeedsOutpainting(
        1920, 1080,
        100, 50,
        { x: 0, y: 0 }
      )
      
      expect(result.needsOutpaint).toBe(false)
    })

    it('should calculate empty areas correctly', async () => {
      const { checkNeedsOutpainting } = await import('../lib/outpaint')
      
      // Square image -> wide banner
      const result = checkNeedsOutpainting(
        500, 500,   // source: square
        728, 90,    // target: wide banner
        { x: 0, y: 0 }
      )
      
      expect(result.needsOutpaint).toBe(true)
      // Should have empty areas on left and right
      expect(result.emptyAreas.left).toBeGreaterThan(0)
      expect(result.emptyAreas.right).toBeGreaterThan(0)
    })
  })

  describe('calculateScaledDimensions', () => {
    it('should scale to cover target', async () => {
      const { calculateScaledDimensions } = await import('../lib/outpaint')
      
      const result = calculateScaledDimensions(
        1000, 500,  // source 2:1
        300, 300    // target 1:1
      )
      
      // Should scale to cover, so height should match target
      expect(result.height).toBeGreaterThanOrEqual(300)
    })
  })

  describe('outpaintWithOffset', () => {
    it('should use blur fallback when no API key', async () => {
      const { outpaintWithOffset } = await import('../lib/outpaint')
      
      // Create a simple test image
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      
      const result = await outpaintWithOffset(
        testImage,
        undefined, // no API key
        { width: 300, height: 250 },
        { x: 0, y: 0 }
      )
      
      expect(result.success).toBe(true)
      expect(result.usedFallback).toBe(true)
    })

    it('should attempt DALL-E when API key provided', async () => {
      const { outpaintWithOffset } = await import('../lib/outpaint')
      
      // Mock successful DALL-E response
      mockFetchSuccess({
        data: [{ b64_json: 'dGVzdA==' }]
      })
      
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      
      const result = await outpaintWithOffset(
        testImage,
        'sk-test-key-12345678901234567890',
        { width: 728, height: 90 },
        { x: 0, y: 0 }
      )
      
      // Should attempt API call
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should fallback to blur on API error', async () => {
      const { outpaintWithOffset } = await import('../lib/outpaint')
      
      // Mock failed API call
      mockFetchError('Rate limit exceeded', 429)
      
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      
      const result = await outpaintWithOffset(
        testImage,
        'sk-test-key-12345678901234567890',
        { width: 300, height: 250 },
        { x: 0, y: 0 }
      )
      
      expect(result.success).toBe(true)
      expect(result.usedFallback).toBe(true)
    })
  })
})
