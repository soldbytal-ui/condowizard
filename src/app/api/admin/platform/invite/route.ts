import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/scale-auth';

/**
 * GET /api/admin/platform/invite?token=XXX — validate invite token
 * POST /api/admin/platform/invite — complete signup (set password)
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const invite = await prisma.scaleTenantInvite.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invite) return NextResponse.json({ error: 'Invalid invitation link.' }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: 'This invitation has already been used.' }, { status: 410 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 });

    return NextResponse.json({
      valid: true,
      tenant: {
        id: invite.tenant.id,
        businessName: invite.tenant.businessName,
        industry: invite.tenant.industry,
        plan: invite.tenant.plan,
      },
      email: invite.email,
      ownerName: invite.tenant.ownerName,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Validation failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password, businessName, industry, brandColor } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const invite = await prisma.scaleTenantInvite.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invitation.' }, { status: 410 });
    }

    // Update tenant details if provided
    await prisma.scaleTenant.update({
      where: { id: invite.tenantId },
      data: {
        ...(businessName ? { businessName } : {}),
        ...(industry ? { industry } : {}),
        ...(brandColor ? { brandColor } : {}),
        acceptedAt: new Date(),
        status: 'active',
        lastActiveAt: new Date(),
      },
    });

    // Create tenant user
    const user = await prisma.scaleTenantUser.upsert({
      where: { tenantId_email: { tenantId: invite.tenantId, email: invite.email } },
      update: { passwordHash: await hashPassword(password) },
      create: {
        tenantId: invite.tenantId,
        email: invite.email,
        name: invite.tenant.ownerName,
        role: 'owner',
        passwordHash: await hashPassword(password),
      },
    });

    // Mark invite as used
    await prisma.scaleTenantInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId: invite.tenantId,
      isSuperAdmin: false,
    });

    return NextResponse.json({ success: true, tenantId: invite.tenantId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Signup failed' }, { status: 500 });
  }
}
