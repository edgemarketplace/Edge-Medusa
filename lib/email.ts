import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

// Use unverified sender for test mode, verified domain for production
function getFromAddress(): string {
  // If using re_test_ key, MUST use onboarding@resend.dev
  const key = process.env.RESEND_API_KEY || '';
  if (key.startsWith('re_test')) {
    return 'onboarding@resend.dev';
  }
  return 'orders@edgemarketplacehub.com';
}

function getWelcomeFrom(): string {
  const key = process.env.RESEND_API_KEY || '';
  if (key.startsWith('re_test')) {
    return 'onboarding@resend.dev';
  }
  return 'welcome@edgemarketplacehub.com';
}

interface WelcomeEmailProps {
  to: string;
  businessName: string;
  buildUrl: string;
  isLive?: boolean;
  stripeConnectUrl?: string;
}

export async function sendWelcomeEmail({ to, businessName, buildUrl, isLive, stripeConnectUrl }: WelcomeEmailProps) {
  const client = getResend();
  if (!client) {
    console.warn('[EMAIL] RESEND_API_KEY not set, skipping welcome email');
    return { skipped: true, reason: 'no_api_key' };
  }

  const isLaunch = !!(isLive && stripeConnectUrl);
  const fromAddr = getWelcomeFrom();

  try {
    const result = await client.emails.send({
      from: `Edge Marketplace Hub <${fromAddr}>`,
      to,
      subject: isLaunch
        ? `Your store is live, ${businessName}!`
        : `Welcome to Edge Marketplace Hub, ${businessName}!`,
      html: htmlWelcome({ isLaunch, businessName, buildUrl, stripeConnectUrl }),
    });
    console.log('[EMAIL] Welcome sent to', to, '— id:', result?.data?.id || 'no-id');
    return { sent: true, id: result?.data?.id };
  } catch (error: any) {
    console.error('[EMAIL] Welcome failed:', error?.message || error);
    // Log the full error for debugging
    if (error?.response) {
      try {
        const body = await error.response.text();
        console.error('[EMAIL] Welcome error body:', body);
      } catch {}
    }
    return { sent: false, error: error?.message };
  }
}

interface OrderNotificationEmailProps {
  to: string;
  businessName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  customerEmail: string;
}

export async function sendOrderNotificationEmail({ to, businessName, orderId, items, total, customerEmail }: OrderNotificationEmailProps) {
  const client = getResend();
  if (!client) {
    console.warn('[EMAIL] RESEND_API_KEY not set, skipping order notification');
    return { skipped: true };
  }

  try {
    const result = await client.emails.send({
      from: `Edge Marketplace Hub <${getFromAddress()}>`,
      to,
      subject: `New order on ${businessName}`,
      html: htmlMerchantOrder({ businessName, orderId, items, total, customerEmail }),
    });
    console.log('[EMAIL] Merchant notification sent to', to, '— id:', result?.data?.id);
    return { sent: true, id: result?.data?.id };
  } catch (error: any) {
    console.error('[EMAIL] Merchant notification failed:', error?.message || error);
    return { sent: false, error: error?.message };
  }
}

interface CustomerOrderConfirmationEmailProps {
  to: string;
  businessName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
}

export async function sendCustomerOrderConfirmationEmail({ to, businessName, orderId, items, total }: CustomerOrderConfirmationEmailProps) {
  const client = getResend();
  if (!client) {
    console.warn('[EMAIL] RESEND_API_KEY not set, skipping customer confirmation');
    return { skipped: true };
  }

  try {
    const result = await client.emails.send({
      from: `Edge Marketplace Hub <${getFromAddress()}>`,
      to,
      subject: `Order confirmation from ${businessName}`,
      html: htmlCustomerOrder({ businessName, orderId, items, total }),
    });
    console.log('[EMAIL] Customer confirmation sent to', to, '— id:', result?.data?.id);
    return { sent: true, id: result?.data?.id };
  } catch (error: any) {
    console.error('[EMAIL] Customer confirmation failed:', error?.message || error);
    return { sent: false, error: error?.message };
  }
}

// ─── HTML Templates ───

function htmlWelcome(props: { isLaunch: boolean; businessName: string; buildUrl: string; stripeConnectUrl?: string }) {
  const { isLaunch, businessName, buildUrl, stripeConnectUrl } = props;
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 48px; height: 48px; background: #2D2D2D; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: white; font-family: serif; font-style: italic; font-weight: bold; font-size: 24px;">E</div>
      </div>
      <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 16px; text-align: center;">
        ${isLaunch ? 'Your store is live!' : 'Your store is ready to build'}
      </h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
        Hi ${businessName},<br><br>
        ${isLaunch
          ? 'Congratulations! Your store is now live and ready to accept orders.'
          : 'Your storefront has been created. Complete your setup in 15 minutes:'}
      </p>
      <div style="background: #F9F8F6; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <ol style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 2;">
          ${isLaunch
            ? `<li>View your live store</li><li>Connect Stripe to receive payments</li><li>Share your store link</li>`
            : `<li>Customize your page sections</li><li>Add your products or services</li><li>Connect Stripe to accept payments</li><li>Launch your store</li>`}
        </ol>
      </div>
      ${isLaunch && stripeConnectUrl ? `
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">Connect Stripe to get paid</h3>
          <p style="font-size: 14px; color: #666; margin: 0 0 16px 0;">
            You're live! Connect your Stripe account to start receiving payments from customers.
          </p>
          <a href="${stripeConnectUrl}" style="display: inline-block; background: #635BFF; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Connect Stripe →
          </a>
        </div>
      ` : ''}
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${buildUrl}" style="display: inline-block; background: #2D2D2D; color: #fff; padding: 16px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 16px;">
          ${isLaunch ? 'View your store →' : 'Continue building →'}
        </a>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        Need help? Reply to this email or visit our support center.
      </p>
    </div>
  `;
}

function htmlMerchantOrder(props: { businessName: string; orderId: string; items: any[]; total: string; customerEmail: string }) {
  const { businessName, orderId, items, total, customerEmail } = props;
  const itemsList = items.map(item =>
    `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${item.price}</td></tr>`
  ).join('');

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">New order on ${businessName}</h1>
      <p style="color: #666; margin-bottom: 24px;">Order #${orderId.slice(0, 8)} from ${customerEmail}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead><tr style="border-bottom: 2px solid #000;"><th style="text-align: left; padding: 8px 0; font-size: 12px; text-transform: uppercase; color: #999;">Item</th><th style="text-align: center; padding: 8px 0; font-size: 12px; text-transform: uppercase; color: #999;">Qty</th><th style="text-align: right; padding: 8px 0; font-size: 12px; text-transform: uppercase; color: #999;">Price</th></tr></thead>
        <tbody>${itemsList}</tbody>
      </table>
      <div style="text-align: right; font-size: 18px; font-weight: bold; padding-top: 16px; border-top: 2px solid #000;">Total: ${total}</div>
    </div>
  `;
}

function htmlCustomerOrder(props: { businessName: string; orderId: string; items: any[]; total: string }) {
  const { businessName, orderId, items, total } = props;
  const itemsList = items.map(item =>
    `<li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;"><span>${item.name} ×${item.quantity}</span><span>${item.price}</span></li>`
  ).join('');

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Thank you for your order!</h1>
      <p style="color: #666; margin-bottom: 24px;">Order #${orderId.slice(0, 8)} from ${businessName}</p>
      <ul style="list-style: none; padding: 0; margin: 0 0 16px;">${itemsList}</ul>
      <div style="font-size: 18px; font-weight: bold; padding-top: 16px; border-top: 2px solid #000; text-align: right;">Total: ${total}</div>
      <p style="color: #999; font-size: 14px; margin-top: 24px;">${businessName} will be in touch soon to confirm your order details.</p>
    </div>
  `;
}
