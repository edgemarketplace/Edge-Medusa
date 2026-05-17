import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimitResponse } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

// Public endpoint — rate limited to prevent spam
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const limited = rateLimitResponse(req, 'contact')
  if (limited) return limited

  const { siteId } = await params
  const { name, email, subject, message } = await req.json()

  if (!email || !message) {
    return NextResponse.json({ error: 'Email and message are required' }, { status: 400 })
  }

  let stored = false

  // 1. Try to store in DB (best-effort — tables may not exist)
  try {
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('site_id', siteId)
      .eq('customer_email', email)
      .maybeSingle()

    if (!conversation) {
      const { data: newConv } = await supabaseAdmin
        .from('conversations')
        .insert({
          site_id: siteId,
          customer_email: email,
          customer_name: name || email.split('@')[0],
          subject: subject || 'New Inquiry',
          last_message: message,
          status: 'open'
        })
        .select()
        .single()
      conversation = newConv
    } else {
      await supabaseAdmin
        .from('conversations')
        .update({
          last_message: message,
          updated_at: new Date().toISOString(),
          status: 'open'
        })
        .eq('id', conversation.id)
    }

    if (conversation) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversation.id,
        sender: 'customer',
        content: message
      })
      stored = true
    }
  } catch (dbErr) {
    console.warn('[CONTACT] DB storage failed (tables may not exist):', dbErr)
  }

  // 2. Email notification to store owner (critical — works even without DB)
  try {
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('business_name, contact_email')
      .eq('id', siteId)
      .single()

    if (site?.contact_email && process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const key = process.env.RESEND_API_KEY || ''
      const fromAddr = key.startsWith('re_test') ? 'onboarding@resend.dev' : 'contact@edgemarketplacehub.com'

      await resend.emails.send({
        from: `Edge Marketplace Hub <${fromAddr}>`,
        to: site.contact_email,
        subject: `New contact form: ${subject || 'No subject'} — ${site.business_name || 'your store'}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">New contact form submission</h2>
            <p><strong>Store:</strong> ${site.business_name || 'Your store'}</p>
            <p><strong>From:</strong> ${name || 'Unknown'} (${email})</p>
            <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
            <p style="margin-top: 24px; font-size: 12px; color: #999;">
              Reply directly to this email to respond to the customer.
            </p>
          </div>
        `,
        replyTo: email,
      })
    }
  } catch (emailErr) {
    console.error('[CONTACT] Email notification failed:', emailErr)
  }

  return NextResponse.json({ ok: true, stored })
}
