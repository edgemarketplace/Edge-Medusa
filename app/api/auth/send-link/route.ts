import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Send magic link email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if this email has any sites
    const { data: sites } = await supabaseAdmin
      .from('sites')
      .select('id, business_name, status')
      .eq('contact_email', email.toLowerCase().trim());

    if (!sites || sites.length === 0) {
      // Don't reveal whether email exists — just say "check your email"
      return NextResponse.json({ ok: true, message: 'Check your email for a login link' });
    }

    // Generate a secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store the session token
    await supabaseAdmin
      .from('auth_sessions')
      .insert({
        email: email.toLowerCase().trim(),
        token,
        expires_at: expiresAt.toISOString(),
      });

    // Build the magic link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${appUrl}/api/auth/verify?token=${token}`;

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Edge Marketplace Hub <login@edgemarketplacehub.com>',
        to: email,
        subject: 'Your login link for Edge Marketplace Hub',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 48px; height: 48px; background: #000; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: white; font-family: serif; font-style: italic; font-weight: bold; font-size: 24px;">E</div>
            </div>
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">Welcome back</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Click the button below to access your store${sites.length > 1 ? 's' : ''}:
            </p>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${magicLink}" style="display: inline-block; background: #000; color: #fff; padding: 16px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Access your account →
              </a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
              This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } else {
      // Log the magic link for development
      console.log('MAGIC LINK (dev mode):', magicLink);
    }

    return NextResponse.json({ ok: true, message: 'Check your email for a login link' });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Failed to send login link' }, { status: 500 });
  }
}
