import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(req, siteId)

    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('site_id', siteId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(conversations)
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
