/**
 * Scale Platform Integrations — Tal's own keys for running Scale as a business.
 *
 * SEPARATE from tenant-level integrations (each customer's own keys).
 * Platform integrations power: invite emails, billing, platform AI.
 * Tenant integrations power: their email campaigns, ads, voice agents.
 *
 * ═══════════════════════════════════════════════════════════════
 * PLATFORM ENVIRONMENT VARIABLES (set in Vercel):
 * ═══════════════════════════════════════════════════════════════
 *
 * PLATFORM_RESEND_API_KEY=re_xxxxxxxxxxxx
 *   Tal's Resend key. Used to send tenant invite emails.
 *   For MVP: use the same key already powering CondoWizard emails.
 *   Production: create dedicated sender domain (e.g. scale.condowizard.ca).
 *
 * PLATFORM_RESEND_SENDER=tal@condowizard.ca
 *   From address. Must be verified in Resend.
 *
 * PLATFORM_RESEND_NAME=Tal from Scale
 *   Display name on outgoing emails.
 *
 * ANTHROPIC_API_KEY=sk-ant-xxxxx
 *   Already set. Used for platform AI features.
 *
 * JWT_SECRET=<32-char-random>
 *   Already set. Powers auth sessions.
 *
 * NEXT_PUBLIC_APP_URL=https://condowizard.vercel.app
 *   Base URL for invite links.
 */

export interface PlatformIntegrations {
  resend?: {
    apiKey: string;
    senderEmail: string;
    senderName: string;
  };
  anthropic?: {
    apiKey: string;
  };
  stripe?: {
    configured: boolean;
  };
}

export function getPlatformIntegrations(): PlatformIntegrations {
  return {
    resend: process.env.PLATFORM_RESEND_API_KEY ? {
      apiKey: process.env.PLATFORM_RESEND_API_KEY,
      senderEmail: process.env.PLATFORM_RESEND_SENDER || 'tal@condowizard.ca',
      senderName: process.env.PLATFORM_RESEND_NAME || 'Tal from Scale',
    } : undefined,
    anthropic: process.env.ANTHROPIC_API_KEY ? {
      apiKey: process.env.ANTHROPIC_API_KEY,
    } : undefined,
    stripe: undefined, // TODO: Add Stripe integration
  };
}

export function isPlatformResendConfigured(): boolean {
  return !!process.env.PLATFORM_RESEND_API_KEY;
}

export async function sendPlatformEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ sent: boolean; error?: string }> {
  const { resend } = getPlatformIntegrations();

  if (!resend) {
    return { sent: false, error: 'Platform Resend not configured. Set PLATFORM_RESEND_API_KEY in Vercel env vars.' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${resend.senderName} <${resend.senderEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { sent: false, error: (err as Record<string, string>).message || `Resend error ${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Email send failed' };
  }
}
