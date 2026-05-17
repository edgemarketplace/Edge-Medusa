import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAuthSession } from '@/lib/auth-server'

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

async function createBuilderSession(email: string) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

  const { error } = await supabaseAdmin.from('auth_sessions').insert({
    email: email.toLowerCase().trim(),
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw error

  return { token, email: email.toLowerCase().trim() }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_name, business_type, offerings, contact_email, tagline, style_preset, theme_id } = body

    if (!business_name || !business_type || !contact_email) {
      return NextResponse.json(
        { error: 'business_name, business_type, and contact_email are required' },
        { status: 400 }
      )
    }

    const STYLE_MAP: Record<string, any> = {
      milano: { primaryColor: '#1A1A1A', fontFamily: 'Georgia, "Times New Roman", Times, serif', backgroundColor: '#F9F8F6', accentColor: '#1A1A1A', borderRadius: '0px' },
      midnight: { primaryColor: '#6366F1', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#0F0F14', accentColor: '#6366F1', borderRadius: '8px' },
      sunlit: { primaryColor: '#F59E0B', fontFamily: 'Georgia, "Times New Roman", Times, serif', backgroundColor: '#FFFBF0', accentColor: '#F59E0B', borderRadius: '12px' },
      sage: { primaryColor: '#6B7C6A', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#F4F7F4', accentColor: '#6B7C6A', borderRadius: '24px' },
    }

    const style = STYLE_MAP[style_preset] || STYLE_MAP.milano

    const site_token = crypto.randomUUID()
    const insertData: any = {
      business_name,
      business_type,
      offerings: offerings || '',
      contact_email,
      site_token,
      status: 'draft',
      template_data: {
        sections: [],
        ...style,
      },
    }

    if (tagline) insertData.tagline = tagline
    if (theme_id) insertData.theme_id = theme_id

    const { data, error } = await supabaseAdmin
      .from('sites')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Site creation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Send welcome email (best effort)
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendWelcomeEmail } = await import('@/lib/email')
        await sendWelcomeEmail({
          to: contact_email,
          businessName: business_name,
          buildUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.edgemarketplacehub.com'}/build/${data.id}`,
        })
      }
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr)
    }

    const session = await createBuilderSession(contact_email)
    const response = NextResponse.json(data, { status: 201 })
    response.cookies.set('auth_token', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
    response.cookies.set('auth_email', session.email, {
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return response
  } catch (error: any) {
    console.error('POST /api/sites error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sites — returns ONLY the authenticated user's sites.
 * Dashboard calls this; requires valid auth_token cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await validateAuthSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('sites')
      .select('id, business_name, business_type, status, subdomain, created_at, updated_at, published, published_at')
      .eq('contact_email', session.email.toLowerCase().trim())
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Site fetch error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET /api/sites error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
