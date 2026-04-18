import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, createSession, logout } from '@/lib/scale-auth';

/**
 * POST /api/admin/platform/auth
 * Handles super admin login, setup, and logout.
 */
export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name } = await req.json();

    // ── SETUP (create first super admin) ──
    if (action === 'setup') {
      const existing = await prisma.scaleSuperAdmin.findFirst();
      if (existing) {
        return NextResponse.json({ error: 'Super admin already exists. Use login instead.' }, { status: 400 });
      }
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Email, password, and name are required.' }, { status: 400 });
      }

      const admin = await prisma.scaleSuperAdmin.create({
        data: { email, passwordHash: await hashPassword(password), name },
      });

      await createSession({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        isSuperAdmin: true,
      });

      return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } });
    }

    // ── LOGIN ──
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const admin = await prisma.scaleSuperAdmin.findUnique({ where: { email } });
      if (!admin) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const valid = await verifyPassword(password, admin.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      await prisma.scaleSuperAdmin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      await createSession({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        isSuperAdmin: true,
      });

      return NextResponse.json({ success: true });
    }

    // ── LOGOUT ──
    if (action === 'logout') {
      await logout();
      return NextResponse.json({ success: true });
    }

    // ── TENANT LOGIN ──
    if (action === 'tenant_login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const user = await prisma.scaleTenantUser.findFirst({
        where: { email },
        include: { tenant: true },
      });
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      await prisma.scaleTenantUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      await prisma.scaleTenant.update({
        where: { id: user.tenantId },
        data: { lastActiveAt: new Date() },
      });

      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        isSuperAdmin: false,
      });

      return NextResponse.json({ success: true, tenantId: user.tenantId });
    }

    // ── CHECK ──
    if (action === 'check_setup') {
      const count = await prisma.scaleSuperAdmin.count();
      return NextResponse.json({ hasAdmin: count > 0 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[platform/auth]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Auth error' }, { status: 500 });
  }
}
