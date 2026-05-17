import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from './supabase'

export interface AuthSession {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string | null;
}

/**
 * Validate auth_token cookie against auth_sessions table.
 * Returns the session object or null if invalid/expired.
 */
export async function validateAuthSession(request: NextRequest): Promise<AuthSession | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;

  const { data: session, error } = await supabaseAdmin
    .from('auth_sessions')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) return null;

  return session as AuthSession;
}

/**
 * Middleware-style guard: returns 401 if no valid session.
 * Use at top of protected route handlers.
 */
export async function requireAuthSession(request: NextRequest): Promise<AuthSession> {
  const session = await validateAuthSession(request);
  if (!session) {
    throw new AuthError('Unauthorized', 401);
  }
  return session;
}

/**
 * Check if a user owns a site (by contact_email match).
 * Returns site data or throws 403.
 */
export async function requireSiteAdmin(request: NextRequest, siteId: string): Promise<{ site: any; session: AuthSession }> {
  const session = await requireAuthSession(request);

  const { data: site, error } = await supabaseAdmin
    .from('sites')
    .select('id, contact_email, business_name')
    .eq('id', siteId)
    .single();

  if (error || !site) {
    throw new AuthError('Site not found', 404);
  }

  if (site.contact_email?.toLowerCase().trim() !== session.email.toLowerCase().trim()) {
    throw new AuthError('Forbidden: you do not own this site', 403);
  }

  return { site, session };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

/**
 * Helper to wrap route handlers with consistent error handling.
 */
export function withAuth(handler: (req: NextRequest, session: AuthSession) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const session = await requireAuthSession(request);
      return await handler(request, session);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error('Auth handler error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
