import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/scale-auth';
import { sendPlatformEmail } from '@/lib/scale-platform-integrations';
import { logAudit } from '@/lib/scale-tenant';

/**
 * POST /api/admin/platform/invite/send-email
 * Sends (or re-sends) an invite email using platform-level Resend.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdmin();
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const tenant = await prisma.scaleTenant.findUnique({
      where: { id: tenantId },
      include: { invites: { where: { usedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const invite = tenant.invites[0];
    if (!invite) {
      return NextResponse.json({ error: 'No active invite found. Regenerate the invite first.' }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired. Regenerate the invite first.' }, { status: 410 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://condowizard.vercel.app';
    const inviteLink = `${baseUrl}/signup/complete?token=${invite.token}`;

    const html = `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; color: #1a1a1a;">
  <div style="background: #0A0A0A; padding: 40px 30px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #FF4A1C; margin: 0; font-size: 28px;">Welcome to Scale</h1>
    <p style="color: #F3F0E8; margin-top: 8px; font-size: 16px;">AI-powered automation for your business</p>
  </div>
  <div style="background: #fff; padding: 40px 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hi ${tenant.ownerName},</p>
    <p>Tal Shelef has set up a Scale account for <strong>${tenant.businessName}</strong>.</p>
    <p>Scale gives you:</p>
    <ul>
      <li>AI agents that call and qualify your leads</li>
      <li>Automated ad campaigns across Google and Meta</li>
      <li>A full CRM with smart follow-ups</li>
      <li>SEO intelligence and keyword research</li>
      <li>And much more, tailored to ${tenant.industry.replace(/_/g, ' ')}</li>
    </ul>
    <div style="margin: 32px 0; text-align: center;">
      <a href="${inviteLink}" style="display: inline-block; background: #FF4A1C; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Accept invitation &rarr;
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">
      Or copy this link:<br>
      <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">${inviteLink}</code>
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 24px;">
      This link expires in 7 days. If you didn't expect this, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
    <p style="font-size: 13px; color: #999;">
      Scale by Tal Shelef &middot; Rare Real Estate Inc.<br>
      1701 Avenue Rd, Toronto, ON M5M 3Y3
    </p>
  </div>
</div>`;

    const result = await sendPlatformEmail(
      tenant.ownerEmail,
      `You've been invited to Scale — ${tenant.businessName}`,
      html
    );

    if (!result.sent) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await logAudit(session.email, 'invite_email_sent', tenantId, `Sent invite email to ${tenant.ownerEmail}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Send failed' }, { status: 500 });
  }
}
