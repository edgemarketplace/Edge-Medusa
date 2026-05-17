import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function safeCount(table: string) {
  try {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })

    return { table, count: count || 0, ok: !error, error: error?.message || null }
  } catch (error: any) {
    return { table, count: 0, ok: false, error: error?.message || 'count failed' }
  }
}

export async function GET() {
  const medusaUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ''
  const tables = await Promise.all([
    safeCount('sites'),
    safeCount('inventory_items'),
    safeCount('orders'),
    safeCount('order_items'),
  ])

  let medusaHealth: { ok: boolean; status?: number; error?: string } = { ok: false, error: 'MEDUSA_BACKEND_URL is not configured' }

  if (medusaUrl) {
    try {
      const response = await fetch(`${medusaUrl.replace(/\/$/, '')}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(3500),
      })
      medusaHealth = { ok: response.ok, status: response.status }
    } catch (error: any) {
      medusaHealth = { ok: false, error: error?.message || 'Medusa health check failed' }
    }
  }

  return NextResponse.json({
    ok: tables.every(item => item.ok),
    service: 'edge-medusa-backend-console',
    medusa: {
      configured: Boolean(medusaUrl),
      url: medusaUrl || null,
      health: medusaHealth,
      nativeAdminPath: medusaUrl ? `${medusaUrl.replace(/\/$/, '')}/app` : null,
    },
    tables,
    routes: {
      console: '/backend',
      proxy: '/api/medusa/[...path]',
      status: '/api/backend/status',
      nativeAdmin: '/app on the Medusa service',
    },
  })
}
