import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isMissingSupabaseTableError, missingAuthSessionsMessage } from '@/lib/supabase-schema-errors'

/**
 * Skip-auth endpoint for onboarding flow.
 * When a user clicks "Skip for now" in email-gate,
 * we create a temporary auth session tied to their site's email.
 * This lets them use the builder without a password/magic link.
 * Session expires in 7 days so skipped users can come back to finish.
 */
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json()

    if (!siteId) {
      return NextResponse.json({ error: 'siteId required' }, { status: 400 })
    }

    // Look up the site to get the contact email
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('contact_email')
      .eq('id', siteId)
      .single()

    if (siteError || !site?.contact_email) {
      return NextResponse.json(
        { error: 'Site not found or missing contact email' },
        { status: 404 }
      )
    }

    const email = site.contact_email.toLowerCase().trim()

    // Generate a secure token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

    // Store the session token
    const { error: sessionError } = await supabaseAdmin.from('auth_sessions').insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      if (isMissingSupabaseTableError(sessionError, 'auth_sessions')) {
        return NextResponse.json(
          { error: missingAuthSessionsMessage(), setup_required: true },
          { status: 500 }
        )
      }
      throw sessionError
    }

    const response = NextResponse.json({ ok: true, email }, { status: 200 })
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
    response.cookies.set('auth_email', email, {
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return response
  } catch (error: any) {
    console.error('Skip-auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    )
  }
}
