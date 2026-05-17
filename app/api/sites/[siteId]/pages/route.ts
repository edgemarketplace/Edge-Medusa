import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import type { PageData } from '@/lib/types'
import { Events } from '@/lib/events'

// GET all pages for a site — public (used by storefront)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const { data, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase pages GET error:', JSON.stringify(error))
      return NextResponse.json({ error: `Failed to fetch pages: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Get pages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// CREATE a new page — auth required
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const body = await request.json()
    const { slug, title, sections } = body

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('pages')
      .insert({
        site_id: siteId,
        slug,
        title,
        sections: sections || [],
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Page with this slug already exists' }, { status: 409 })
      }
      console.error('Supabase pages POST error:', JSON.stringify(error))
      return NextResponse.json({ error: `Failed to create page: ${error.message}` }, { status: 500 })
    }

    // Emit domain event
    await Events.pageUpdated(siteId, data.id, (body.sections || []).length)

    return NextResponse.json(data as PageData, { status: 201 })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Create page error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
