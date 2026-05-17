import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = rateLimitResponse(request, 'auth-verify')
  if (limited) return limited

  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid', request.url));
    }

    // Look up the session
    const { data: session, error } = await supabaseAdmin
      .from('auth_sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !session) {
      return NextResponse.redirect(new URL('/login?error=invalid', request.url));
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired', request.url));
    }

    // Check if already used
    if (session.used_at) {
      return NextResponse.redirect(new URL('/login?error=used', request.url));
    }

    // Mark as used
    await supabaseAdmin
      .from('auth_sessions')
      .update({ used_at: new Date().toISOString() })
      .eq('id', session.id);

    // Create a session token for the client
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store a longer-lived session
    await supabaseAdmin
      .from('auth_sessions')
      .insert({
        email: session.email,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    // Redirect to account page with session token
    const response = NextResponse.redirect(new URL('/account', request.url));
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    response.cookies.set('auth_email', session.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.redirect(new URL('/login?error=server', request.url));
  }
}
