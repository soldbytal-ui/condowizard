import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, createSession } from '@/lib/scale-auth';
import { logAudit } from '@/lib/scale-tenant';

/**
 * POST /api/admin/platform/impersonate
 * Lets a super admin view Scale as a specific tenant.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdmin();
    const { tenantId, action } = await req.json();

    if (action === 'stop') {
      // Return to super admin session
      await createSession({
        userId: session.userId,
        email: session.email,
        name: session.name,
        isSuperAdmin: true,
      });
      return NextResponse.json({ success: true });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const tenant = await prisma.scaleTenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create impersonation session
    await createSession({
      userId: session.userId,
      email: session.email,
      name: session.name,
      tenantId: tenant.id,
      isSuperAdmin: true,
      impersonatingTenant: tenant.id,
    });

    await logAudit(session.email, 'impersonation_started', tenantId, `Viewing as ${tenant.businessName}`);

    return NextResponse.json({ success: true, tenant: { id: tenant.id, businessName: tenant.businessName } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
}
