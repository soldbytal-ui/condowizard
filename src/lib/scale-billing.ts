/**
 * Scale Billing — stub functions for Stripe integration.
 * Currently just updates the Tenant record. Real Stripe integration is future work.
 */

import { prisma } from './prisma';

// TODO: Replace with actual Stripe SDK calls
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createStripeCustomer(tenantId: string): Promise<string> {
  // TODO: Call stripe.customers.create({ email, name, metadata: { tenantId } })
  const customerId = `cus_placeholder_${tenantId.slice(0, 8)}`;
  await prisma.scaleTenant.update({
    where: { id: tenantId },
    data: { stripeCustomerId: customerId },
  });
  return customerId;
}

export async function createSubscription(tenantId: string, plan: string): Promise<string> {
  // TODO: Call stripe.subscriptions.create({ customer, items: [{ price: planPriceId }] })
  const subId = `sub_placeholder_${Date.now().toString(36)}`;
  const credits: Record<string, number> = { starter: 2000, pro: 10000, team: 50000, enterprise: 100000 };
  await prisma.scaleTenant.update({
    where: { id: tenantId },
    data: {
      plan,
      status: 'active',
      stripeSubscriptionId: subId,
      creditsMonthly: credits[plan] || 2000,
      creditsBalance: credits[plan] || 2000,
    },
  });
  return subId;
}

export async function cancelSubscription(tenantId: string): Promise<void> {
  // TODO: Call stripe.subscriptions.cancel(subscriptionId)
  await prisma.scaleTenant.update({
    where: { id: tenantId },
    data: { status: 'churned', stripeSubscriptionId: null },
  });
}

export async function updatePlan(tenantId: string, newPlan: string): Promise<void> {
  // TODO: Call stripe.subscriptions.update(subscriptionId, { items: [{ price: newPriceId }] })
  const credits: Record<string, number> = { starter: 2000, pro: 10000, team: 50000, enterprise: 100000 };
  await prisma.scaleTenant.update({
    where: { id: tenantId },
    data: {
      plan: newPlan,
      creditsMonthly: credits[newPlan] || 2000,
    },
  });
}

export async function addCredits(tenantId: string, amount: number, reason: string): Promise<number> {
  const tenant = await prisma.scaleTenant.update({
    where: { id: tenantId },
    data: { creditsBalance: { increment: amount } },
  });
  return tenant.creditsBalance;
}
