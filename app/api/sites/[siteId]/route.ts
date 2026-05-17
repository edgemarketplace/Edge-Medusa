import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import type { SiteData } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params

    // GET is used by builder and storefront — check auth_token if present
    // but still return to allow shared preview with site_token.
    // Builder always sends auth_token; storefronts don't.
    const authToken = request.cookies.get('auth_token')?.value
    let isOwner = false

    if (authToken) {
      const { data: session } = await supabaseAdmin
        .from('auth_sessions')
        .select('email')
        .eq('token', authToken)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (session?.email) {
        const { data: ownership } = await supabaseAdmin
          .from('sites')
          .select('id')
          .eq('id', siteId)
          .eq('contact_email', session.email.toLowerCase().trim())
          .single()
        isOwner = !!ownership
      }
    }

    const { data, error } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    const result = { ...data, isOwner } as SiteData & { isOwner: boolean }
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GET site error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const body = await request.json()

    const allowedFields: Partial<SiteData> = {}
    if (body.template_data !== undefined) allowedFields.template_data = body.template_data
    if (body.status !== undefined) allowedFields.status = body.status
    if (body.subdomain !== undefined) allowedFields.subdomain = body.subdomain
    if (body.stripe_account_id !== undefined) allowedFields.stripe_account_id = body.stripe_account_id
    if (body.business_name !== undefined) allowedFields.business_name = body.business_name
    if (body.tagline !== undefined) (allowedFields as any).tagline = body.tagline
    if (body.contact_email !== undefined) allowedFields.contact_email = body.contact_email

    const { data, error } = await supabaseAdmin
      .from('sites')
      .update(allowedFields)
      .eq('id', siteId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json(data as SiteData)
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('PUT site error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { error } = await supabaseAdmin
      .from('sites')
      .delete()
      .eq('id', siteId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('DELETE site error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
