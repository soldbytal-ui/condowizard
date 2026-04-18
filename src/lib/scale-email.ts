/**
 * Scale Email — send emails via Resend (BYOK architecture).
 * Credentials stored in localStorage "scale-integrations.resend".
 */

export interface ResendConfig {
  apiKey: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;          // plain text body (will be wrapped in HTML template)
  html?: string;         // optional pre-built HTML (skips template wrapping)
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  sentAt?: string;
  error?: string;
}

const DEFAULT_SIGNATURE = `<strong>Tal Shelef</strong>, Sales Representative<br/>
Rare Real Estate Inc., Brokerage<br/>
647-890-4082 · <a href="mailto:contact@condowizard.ca" style="color:#FF4A1C;">contact@condowizard.ca</a><br/>
<a href="https://condowizard.ca" style="color:#FF4A1C;">condowizard.ca</a>`;

/** Get Resend credentials from localStorage. */
export function getResendConfig(): ResendConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('scale-integrations');
    if (!raw) return null;
    const store = JSON.parse(raw);
    const r = store.resend;
    if (!r?.apiKey || !r?.senderEmail) return null;
    return {
      apiKey: r.apiKey,
      senderName: r.senderName || 'Tal Shelef',
      senderEmail: r.senderEmail,
      replyTo: r.replyTo || r.senderEmail,
    };
  } catch {
    return null;
  }
}

/** Check if Resend is connected. */
export function isResendConnected(): boolean {
  return getResendConfig() !== null;
}

/** Wrap plain text body in a clean HTML email template. */
export function wrapInEmailTemplate(body: string, subject: string, signature?: string): string {
  const htmlBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px;">')
    .replace(/\n/g, '<br/>');

  const sig = signature || DEFAULT_SIGNATURE;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject.replace(/</g, '&lt;')}</title>
</head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height:1.6; color:#222; background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 16px;">
              <p style="margin:0 0 16px;">${htmlBody}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px; font-size:13px; color:#666; border-top:1px solid #eee;">
              ${sig}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Send an email via the server-side Resend proxy. */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getResendConfig();
  if (!config) {
    return { success: false, error: 'Resend not connected. Go to Settings → Integrations to connect.' };
  }

  const html = options.html || wrapInEmailTemplate(options.body, options.subject);
  const text = options.body;

  try {
    const res = await fetch('/api/admin/scale/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: config.apiKey,
        from: config.senderEmail,
        fromName: config.senderName,
        replyTo: options.replyTo || config.replyTo,
        to: options.to,
        subject: options.subject,
        html,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return { success: false, error: data.error || `Send failed (${res.status})` };
    }

    return {
      success: true,
      messageId: data.messageId,
      sentAt: data.sentAt,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

/** Replace template variables with lead data. */
export function replaceTemplateVariables(
  template: string,
  lead: { name?: string; email?: string; phone?: string; interest?: string; budget?: string },
  agent?: { name?: string; phone?: string; email?: string; brokerage?: string }
): string {
  const firstName = (lead.name || '').split(' ')[0] || '';
  const lastName = (lead.name || '').split(' ').slice(1).join(' ') || '';
  const neighborhood = (lead.interest || '').match(/(?:king west|yorkville|liberty village|queen west|downtown|midtown|leslieville|roncesvalles|junction|annex|danforth|high park)/i)?.[0] || 'Toronto';

  const replacements: Record<string, string> = {
    '{firstName}': firstName,
    '{lastName}': lastName,
    '{fullName}': lead.name || '',
    '{email}': lead.email || '',
    '{phone}': lead.phone || '',
    '{interest}': lead.interest || 'your inquiry',
    '{neighborhood}': neighborhood,
    '{budget}': lead.budget || 'your price range',
    '{agentName}': agent?.name || 'Tal Shelef',
    '{agentPhone}': agent?.phone || '647-890-4082',
    '{agentEmail}': agent?.email || 'contact@condowizard.ca',
    '{brokerage}': agent?.brokerage || 'Rare Real Estate Inc.',
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }
  return result;
}
