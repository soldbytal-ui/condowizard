import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/scale-auth';
import { createTenant, createInviteToken, logAudit, PLAN_PRICING } from '@/lib/scale-tenant';

/**
 * GET /api/admin/platform/tenants — list all tenants
 * POST /api/admin/platform/tenants — create a new tenant
 */
export async function GET() {
  try {
    await requireSuperAdmin();
    const tenants = await prisma.scaleTenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { leads: true, activities: true, users: true } },
      },
    });
    return NextResponse.json({ tenants });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdmin();
    const body = await req.json();
    const { businessName, ownerEmail, ownerName, industry, plan, creditsBalance, brandColor, logo } = body;

    if (!businessName || !ownerEmail || !ownerName || !industry || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await prisma.scaleTenant.findUnique({ where: { ownerEmail } });
    if (existing) {
      return NextResponse.json({ error: `Tenant with email ${ownerEmail} already exists.` }, { status: 409 });
    }

    const tenant = await createTenant({
      businessName, ownerEmail, ownerName, industry, plan,
      creditsBalance, brandColor, logo,
    });

    const token = await createInviteToken(tenant.id, ownerEmail);
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://condowizard.vercel.app'}/signup/complete?token=${token}`;

    await logAudit(session.email, 'tenant_created', tenant.id, `Created ${businessName} (${plan}) for ${ownerEmail}`);

    // Try to send invitation email via Resend (best-effort)
    let emailSent = false;
    try {
      const pricing = PLAN_PRICING[plan];
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Scale by CondoWizard <noreply@condowizard.ca>',
            to: [ownerEmail],
            subject: "You've been invited to Scale",
            html: `<h2>Welcome to Scale, ${ownerName}!</h2>
<p>Tal Shelef has invited you to use Scale — AI-powered automation for your ${industry.replace('_', ' ')} business.</p>
<p>Your plan: <strong>${pricing?.label || plan}</strong> (${pricing?.credits.toLocaleString() || '2,000'} AI credits/month)</p>
<p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#FF4A1C;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept invitation &amp; set up your account →</a></p>
<p style="color:#888;font-size:13px;">This link expires in 7 days.</p>
<p>— Tal @ Scale</p>`,
          }),
        });
        emailSent = true;
      }
    } catch { /* email is best-effort */ }

    return NextResponse.json({ success: true, tenant, inviteLink, emailSent });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Create failed' }, { status: 500 });
  }
}
