/**
 * Scale Tenant — helpers for tenant-scoped data access.
 */

import { prisma } from './prisma';
import { getSession } from './scale-auth';

export async function getCurrentTenantId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  // If super admin is impersonating, use that tenant
  if (session.isSuperAdmin && session.impersonatingTenant) {
    return session.impersonatingTenant;
  }
  return session.tenantId || null;
}

export async function getCurrentTenant() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;
  return prisma.scaleTenant.findUnique({ where: { id: tenantId } });
}

export async function getTenantById(id: string) {
  return prisma.scaleTenant.findUnique({ where: { id } });
}

export async function getAllTenants() {
  return prisma.scaleTenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { leads: true, activities: true, users: true } } },
  });
}

export async function createTenant(data: {
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  industry: string;
  plan: string;
  creditsBalance?: number;
  creditsMonthly?: number;
  brandColor?: string;
  logo?: string;
}) {
  const planCredits: Record<string, number> = {
    starter: 2000,
    pro: 10000,
    team: 50000,
    enterprise: 100000,
  };
  const credits = data.creditsBalance ?? planCredits[data.plan] ?? 2000;

  return prisma.scaleTenant.create({
    data: {
      businessName: data.businessName,
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName,
      industry: data.industry,
      plan: data.plan,
      creditsBalance: credits,
      creditsMonthly: data.creditsMonthly ?? credits,
      brandColor: data.brandColor || '#FF4A1C',
      logo: data.logo || null,
    },
  });
}

export async function createInviteToken(tenantId: string, email: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await prisma.scaleTenantInvite.create({
    data: {
      tenantId,
      email,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
  return token;
}

export async function logAudit(adminEmail: string, action: string, tenantId?: string, details?: string) {
  return prisma.scaleAuditLog.create({
    data: { adminEmail, action, tenantId, details },
  });
}

export async function logActivity(tenantId: string, type: string, description: string, metadata?: Record<string, unknown>, creditsUsed = 0) {
  return prisma.scaleTenantActivity.create({
    data: { tenantId, type, description, metadata: metadata || undefined, creditsUsed },
  });
}

/** Plan pricing in CAD */
export const PLAN_PRICING: Record<string, { label: string; price: number; credits: number }> = {
  starter: { label: 'Starter', price: 79, credits: 2000 },
  pro: { label: 'Pro', price: 249, credits: 10000 },
  team: { label: 'Team', price: 749, credits: 50000 },
  enterprise: { label: 'Enterprise', price: 0, credits: 100000 },
};
