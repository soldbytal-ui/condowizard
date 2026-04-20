import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/scale-auth';
import { createTenant, createInviteToken, logAudit } from '@/lib/scale-tenant';
import { isPlatformResendConfigured } from '@/lib/scale-platform-integrations';

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

    const rawTenant = await createTenant({
      businessName, ownerEmail, ownerName, industry, plan,
      creditsBalance, brandColor, logo,
    });
    // Re-fetch with _count so the frontend gets the same shape as the list query
    const tenant = await prisma.scaleTenant.findUnique({
      where: { id: rawTenant.id },
      include: { _count: { select: { leads: true, activities: true, users: true } } },
    }) || rawTenant;

    const token = await createInviteToken(tenant.id, ownerEmail);
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://condowizard.vercel.app'}/signup/complete?token=${token}`;

    await logAudit(session.email, 'tenant_created', tenant.id, `Created ${businessName} (${plan}) for ${ownerEmail}`);

    return NextResponse.json({
      success: true,
      tenant,
      inviteLink,
      canSendEmail: isPlatformResendConfigured(),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Create failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSuperAdmin();
    const { tenantId } = await req.json();
    if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });

    await prisma.scaleTenant.delete({ where: { id: tenantId } });
    await logAudit(session.email, 'tenant_deleted', tenantId, `Deleted tenant ${tenantId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Delete failed' }, { status: 500 });
  }
}
