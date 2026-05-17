import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter.
// For production scale, swap to Vercel KV or Upstash.
interface RateEntry {
  count: number
  resetAt: number
}

const rateMap = new Map<string, RateEntry>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  // AI generation: expensive, strict
  'ai-generate': { max: 5, windowMs: 60_000 },       // 5 per minute
  'ai-expand': { max: 20, windowMs: 60_000 },         // 20 per minute
  // Auth: prevent email bombing
  'auth-send-link': { max: 5, windowMs: 60_000 },     // 5 per minute
  'auth-verify': { max: 10, windowMs: 60_000 },       // 10 per minute
  // Checkout: prevent abuse
  'checkout': { max: 10, windowMs: 60_000 },          // 10 per minute
  // Contact forms
  'contact': { max: 5, windowMs: 60_000 },            // 5 per minute
  // Uploads
  'upload': { max: 10, windowMs: 60_000 },            // 10 per minute
  // Images
  'images-generate': { max: 5, windowMs: 60_000 },    // 5 per minute (currently disabled)
  'images-search': { max: 30, windowMs: 60_000 },     // 30 per minute
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Check rate limit for a given key.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(key: string, config?: { max?: number; windowMs?: number }): { allowed: boolean; retryAfter?: number } {
  const limit = config?.max ?? RATE_LIMITS[key]?.max ?? 30
  const windowMs = config?.windowMs ?? RATE_LIMITS[key]?.windowMs ?? 60_000
  const now = Date.now()

  const entry = rateMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true }
}

/**
 * Middleware-style rate limiter. Use at top of route handlers.
 * Returns NextResponse if rate limited, null if allowed.
 */
export function rateLimitResponse(req: NextRequest, key: string, config?: { max?: number; windowMs?: number }): NextResponse | null {
  const ip = getClientIP(req)
  const limitKey = `${key}:${ip}`
  const result = checkRateLimit(limitKey, config)

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.', retryAfter: result.retryAfter },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter || 60) } }
    )
  }

  return null
}

// Clean up expired entries every 5 minutes (only in Node.js environment)
if (typeof globalThis !== 'undefined' && (globalThis as any).setInterval) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateMap) {
      if (now > entry.resetAt) {
        rateMap.delete(key)
      }
    }
  }, 300_000)
}
