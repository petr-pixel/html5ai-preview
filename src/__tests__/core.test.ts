/**
 * AdCreative Studio - Test Suite
 * 
 * Základní testy pro core funkce.
 * Spuštění: npm test
 * 
 * COVERAGE:
 * - OpenAI client
 * - Toast system
 * - Debug system
 * - Utility functions
 * - Cost calculations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
} as any

// ============================================================================
// OPENAI CLIENT TESTS
// ============================================================================

describe('OpenAI Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('testApiKey', () => {
    it('should reject short API keys', async () => {
      const { testApiKey } = await import('../lib/openai-client')
      
      const result = await testApiKey('short')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('krátký')
    })

    it('should validate correct API key', async () => {
      const { testApiKey } = await import('../lib/openai-client')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'gpt-4o' },
            { id: 'dall-e-3' },
          ]
        })
      })
      
      const result = await testApiKey('sk-1234567890123456789012345678901234567890')
      
      expect(result.valid).toBe(true)
      expect(result.hasImageModels).toBe(true)
      expect(result.hasTextModels).toBe(true)
    })

    it('should handle 401 unauthorized', async () => {
      const { testApiKey } = await import('../lib/openai-client')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
      })
      
      const result = await testApiKey('sk-invalid-key-12345678901234567890')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Neplatný')
    })
  })

  describe('generateImage', () => {
    it('should call correct endpoint with params', async () => {
      const { generateImage } = await import('../lib/openai-client')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ b64_json: 'base64imagedata' }]
        })
      })
      
      const result = await generateImage(
        { apiKey: 'sk-test' },
        { prompt: 'test prompt', size: '1024x1024', quality: 'medium' }
      )
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/images/generations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test'
          })
        })
      )
      
      expect(result.success).toBe(true)
      expect(result.images).toHaveLength(1)
      expect(result.images[0]).toContain('data:image/png;base64,')
    })

    it('should handle API errors gracefully', async () => {
      const { generateImage } = await import('../lib/openai-client')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Rate limit exceeded' }
        })
      })
      
      const result = await generateImage(
        { apiKey: 'sk-test' },
        { prompt: 'test' }
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limit')
    })
  })

  describe('estimateCost', () => {
    it('should calculate image costs correctly', async () => {
      const { estimateCost } = await import('../lib/openai-client')
      
      const estimate = estimateCost({
        imageCount: 5,
        imageSize: '1024x1024',
        imageQuality: 'medium',
      })
      
      // medium quality 1024x1024 = $0.042 per image
      expect(estimate.images.cost).toBeCloseTo(0.042 * 5, 3)
      expect(estimate.total).toBeCloseTo(0.042 * 5, 3)
    })

    it('should calculate outpaint costs correctly', async () => {
      const { estimateCost } = await import('../lib/openai-client')
      
      const estimate = estimateCost({
        outpaintCount: 10,
      })
      
      // DALL-E 2 edit = $0.020 per image
      expect(estimate.outpaint.cost).toBeCloseTo(0.020 * 10, 3)
    })

    it('should sum all costs correctly', async () => {
      const { estimateCost } = await import('../lib/openai-client')
      
      const estimate = estimateCost({
        imageCount: 2,
        imageSize: '1024x1024',
        imageQuality: 'low',
        outpaintCount: 3,
        textTokens: 1000,
        textTier: 'standard',
      })
      
      expect(estimate.total).toBeGreaterThan(0)
      expect(estimate.total).toBe(
        estimate.images.cost + estimate.outpaint.cost + estimate.text.cost + estimate.video.cost
      )
    })
  })
})

// ============================================================================
// TOAST SYSTEM TESTS
// ============================================================================

describe('Toast System', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add toast to store', async () => {
    const { toast, useToastStore } = await import('../lib/toast')
    
    const id = toast.success('Test message')
    
    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Test message')
    expect(toasts[0].type).toBe('success')
  })

  it('should auto-dismiss after duration', async () => {
    const { toast, useToastStore } = await import('../lib/toast')
    
    toast.info('Auto dismiss', { duration: 1000 })
    
    expect(useToastStore.getState().toasts).toHaveLength(1)
    
    vi.advanceTimersByTime(1100)
    
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('should not auto-dismiss loading toast', async () => {
    const { toast, useToastStore } = await import('../lib/toast')
    
    toast.loading('Loading...')
    
    vi.advanceTimersByTime(10000)
    
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('should update existing toast by id', async () => {
    const { toast, useToastStore } = await import('../lib/toast')
    
    const id = toast.loading('Loading...', { id: 'my-toast' })
    
    useToastStore.getState().update(id, { 
      type: 'success', 
      message: 'Done!' 
    })
    
    const toasts = useToastStore.getState().toasts
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Done!')
  })

  it('should limit to 5 toasts', async () => {
    const { toast, useToastStore } = await import('../lib/toast')
    
    for (let i = 0; i < 10; i++) {
      toast.info(`Toast ${i}`, { duration: 0 })
    }
    
    expect(useToastStore.getState().toasts.length).toBeLessThanOrEqual(5)
  })
})

// ============================================================================
// DEBUG SYSTEM TESTS
// ============================================================================

describe('Debug System', () => {
  it('should create log entries', async () => {
    const { debug, getLogs, clearLogs } = await import('../lib/debug')
    
    clearLogs()
    
    debug.info('Test', 'Test message', { data: 'test' })
    
    const logs = getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].category).toBe('Test')
    expect(logs[0].message).toBe('Test message')
    expect(logs[0].level).toBe('info')
  })

  it('should filter logs by level', async () => {
    const { debug, getLogs, clearLogs } = await import('../lib/debug')
    
    clearLogs()
    
    debug.info('Test', 'Info')
    debug.error('Test', 'Error')
    debug.warn('Test', 'Warning')
    
    const errorLogs = getLogs({ level: 'error' })
    expect(errorLogs).toHaveLength(1)
    expect(errorLogs[0].message).toBe('Error')
  })

  it('should sanitize sensitive data', async () => {
    const { debug, getLogs, clearLogs } = await import('../lib/debug')
    
    clearLogs()
    
    debug.info('Test', 'Message', { 
      apiKey: 'sk-secret-key',
      openaiKey: 'sk-another-secret'
    })
    
    const logs = getLogs()
    expect(logs[0].data.apiKey).toBe('[REDACTED]')
    expect(logs[0].data.openaiKey).toBe('[REDACTED]')
  })

  it('should measure performance', async () => {
    const { perfStart, perfEnd, getLogs, clearLogs } = await import('../lib/debug')
    
    clearLogs()
    
    const timerId = perfStart('test-operation')
    // Simulate work
    const duration = perfEnd(timerId)
    
    expect(duration).toBeGreaterThanOrEqual(0)
    
    const logs = getLogs({ level: 'perf' })
    expect(logs.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// UTILITY FUNCTIONS TESTS
// ============================================================================

describe('Utility Functions', () => {
  it('should generate unique IDs', async () => {
    const { generateId } = await import('../lib/utils')
    
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    
    expect(ids.size).toBe(100)
  })

  it('should correctly classify cn utility', async () => {
    const { cn } = await import('../lib/utils')
    
    expect(cn('a', 'b')).toBe('a b')
    expect(cn('a', false && 'b', 'c')).toBe('a c')
    expect(cn('a', undefined, 'b')).toBe('a b')
  })
})

// ============================================================================
// PRICING TESTS
// ============================================================================

describe('Pricing Constants', () => {
  it('should have all required price tiers', async () => {
    const { PRICING } = await import('../lib/openai-client')
    
    // Image pricing
    expect(PRICING.images['1024x1024']).toBeDefined()
    expect(PRICING.images['1024x1024'].low).toBeGreaterThan(0)
    expect(PRICING.images['1024x1024'].medium).toBeGreaterThan(PRICING.images['1024x1024'].low)
    expect(PRICING.images['1024x1024'].high).toBeGreaterThan(PRICING.images['1024x1024'].medium)
    
    // Text pricing
    expect(PRICING.text['gpt-4o-mini']).toBeDefined()
    expect(PRICING.text['gpt-4o']).toBeDefined()
    
    // Edit pricing
    expect(PRICING.imageEdit['1024x1024']).toBeDefined()
  })

  it('should have correct relative pricing', async () => {
    const { PRICING } = await import('../lib/openai-client')
    
    // GPT-4o should be more expensive than mini
    expect(PRICING.text['gpt-4o'].input).toBeGreaterThan(PRICING.text['gpt-4o-mini'].input)
    
    // Larger images should cost more
    expect(PRICING.images['1536x1024'].medium).toBeGreaterThan(PRICING.images['1024x1024'].medium)
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  it('should handle full image generation flow', async () => {
    const { generateImage, estimateCost } = await import('../lib/openai-client')
    const { toast } = await import('../lib/toast')
    
    // Estimate cost first
    const estimate = estimateCost({
      imageCount: 1,
      imageSize: '1024x1024',
      imageQuality: 'medium'
    })
    
    expect(estimate.total).toBeCloseTo(0.042, 3)
    
    // Mock successful generation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [{ b64_json: 'test-image-data' }]
      })
    })
    
    const result = await generateImage(
      { apiKey: 'sk-test' },
      { prompt: 'test', size: '1024x1024', quality: 'medium' }
    )
    
    expect(result.success).toBe(true)
    expect(result.cost).toBeCloseTo(estimate.total, 3)
  })
})

// ============================================================================
// EXPORT FOR CLI
// ============================================================================

export {}
