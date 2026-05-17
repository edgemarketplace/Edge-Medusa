import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Skip-auth endpoint for onboarding flow.
 * When a user clicks "Skip for now" in email-gate,
 * we create a temporary auth session tied to their site's email.
 * This lets them use the builder without a password/magic link.
 * Session expires in 30 minutes (same as normal magic link).
 */
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
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Store the session token
    await supabaseAdmin.from('auth_sessions').insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
    })

    // Set auth cookies
    const cookieOptions = [
      `auth_token=${token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${30 * 60}`,
    ].join('; ')

    const emailCookieOptions = [
      `auth_email=${encodeURIComponent(email)}`,
      'Secure',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${30 * 60}`,
    ].join('; ')

    return NextResponse.json(
      { ok: true, email },
      {
        status: 200,
        headers: {
          'Set-Cookie': [cookieOptions, emailCookieOptions].join(', '),
        },
      }
    )
  } catch (error: any) {
    console.error('Skip-auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    )
  }
}
