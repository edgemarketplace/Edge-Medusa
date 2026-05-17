import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const backend = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  if (!backend) {
    return NextResponse.json({ error: 'MEDUSA_BACKEND_URL is not configured' }, { status: 503 })
  }

  const { path } = await params
  const url = new URL(request.url)
  const target = `${backend.replace(/\/$/, '')}/${path.join('/')}${url.search}`
  const headers = new Headers(request.headers)
  headers.delete('host')

  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer()
  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  })

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
