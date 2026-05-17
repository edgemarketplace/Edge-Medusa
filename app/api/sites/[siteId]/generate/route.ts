import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import { generateSiteContent } from '@/lib/ai'
import { rateLimitResponse } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const limited = rateLimitResponse(request, 'ai-generate')
  if (limited) return limited

  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { data: site, error: fetchError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: fetchError.code === 'PGRST116' ? 404 : 500 }
      )
    }

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    const { business_name, business_type, contact_email, offerings, tagline } = site

    const { pages } = await generateSiteContent(
      business_name,
      business_type,
      offerings || '',
      contact_email,
      tagline || '',
      site.style_preset || '',
    )

    const templateData = { pages }

    const { error: updateError } = await supabaseAdmin
      .from('sites')
      .update({
        template_data: templateData,
        status: 'ready',
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Update error:', JSON.stringify(updateError));
      return NextResponse.json(
        { error: `Failed to save: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pages: pages.length,
      pageTitles: pages.map((p: any) => p.title),
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
