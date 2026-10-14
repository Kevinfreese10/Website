import { PartnerTier, PartnerSubscription, Service } from './types';

export type NormalizedPartnerTier = 'starter' | 'practice' | 'enterprise';

export interface PartnerTierPlan {
  id: NormalizedPartnerTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  discountPercent: number;
  discountMultiplier: number;
  aiCompanyLimit: number;
  aiPayrollLimit: number;
  staffSeatLimit: number;
  hasTaskManager: boolean;
  aiCompanyLabel: string;
  aiPayrollLabel: string;
  staffSeatLabel: string;
  features: string[];
  highlighted?: boolean;
}

export const PARTNER_TIER_PLANS: Record<NormalizedPartnerTier, PartnerTierPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Test our back-office fulfillment & AI tools with zero monthly overhead.',
    monthlyPrice: 0,
    discountPercent: 10,
    discountMultiplier: 0.90,
    aiCompanyLimit: 1,
    aiPayrollLimit: 1,
    staffSeatLimit: 1,
    hasTaskManager: true,
    aiCompanyLabel: '1 AI Accounting Client',
    aiPayrollLabel: '1 AI Payroll Client',
    staffSeatLabel: '1 Practice Seat',
    features: [
      '10% Wholesale Discount on all 100+ statutory & tax services',
      '1 AI Accounting Client included',
      '1 AI Payroll Client included',
      '1 Practice Seat & Practice Task Manager',
      '100% Invisible Back-Office (we only ever communicate with you)',
    ],
  },
  practice: {
    id: 'practice',
    name: 'Practice',
    tagline: 'Built for growing accounting and bookkeeping firms scaling their client base.',
    monthlyPrice: 950,
    discountPercent: 30,
    discountMultiplier: 0.70,
    aiCompanyLimit: 10,
    aiPayrollLimit: 10,
    staffSeatLimit: 5,
    hasTaskManager: true,
    aiCompanyLabel: '1 to 10 AI Accounting Clients',
    aiPayrollLabel: '1 to 10 AI Payroll Clients',
    staffSeatLabel: 'Up to 5 Staff Seats',
    highlighted: true,
    features: [
      '30% Wholesale Discount on all 100+ statutory & tax services',
      '1 to 10 AI Accounting Clients included',
      '1 to 10 AI Payroll Clients included',
      'Up to 5 Staff Seats & Practice Task Manager',
      '100% Invisible Back-Office (we only ever communicate with you)',
      'Priority CIPC, SARS, COIDA & NCR Fulfillment Queue',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Your complete, unlimited back-office engine with maximum wholesale margins.',
    monthlyPrice: 4950,
    discountPercent: 50,
    discountMultiplier: 0.50,
    aiCompanyLimit: 999999,
    aiPayrollLimit: 999999,
    staffSeatLimit: 999999,
    hasTaskManager: true,
    aiCompanyLabel: 'Unlimited AI Accounting Clients',
    aiPayrollLabel: 'Unlimited AI Payroll Clients',
    staffSeatLabel: 'Unlimited Staff Seats',
    features: [
      '50% Wholesale Discount on all 100+ statutory & tax services',
      'Unlimited AI Accounting Clients included',
      'Unlimited AI Payroll Clients included',
      'Unlimited Staff Seats & Practice Task Manager',
      '100% Invisible Back-Office (we only ever communicate with you)',
      'Dedicated Back-Office Fulfillment Priority &CA Sign-Off Support',
    ],
  },
};

export function normalizePartnerTier(tier?: PartnerTier | string | null): NormalizedPartnerTier {
  if (!tier) return 'starter';
  const lower = tier.toLowerCase();
  if (lower === 'enterprise' || lower === 'unlimited') return 'enterprise';
  if (lower === 'practice' || lower === 'growth') return 'practice';
  return 'starter';
}

export function getPartnerTierPlan(tier?: PartnerTier | string | null): PartnerTierPlan {
  return PARTNER_TIER_PLANS[normalizePartnerTier(tier)];
}

export function getPartnerDiscountPercent(tier?: PartnerTier | string | null): number {
  return getPartnerTierPlan(tier).discountPercent;
}

/**
 * Calculates the wholesale partner price for a given service and partner tier.
 * Respects optional per-tier custom price overrides set in /admin/services,
 * falling back to the flat tier discount (10% / 30% / 50% off retail service.price).
 */
export function getPartnerServicePrice(
  service: Pick<Service, 'price' | 'starterPartnerPrice' | 'practicePartnerPrice' | 'enterprisePartnerPrice'>,
  tier?: PartnerTier | string | null
): number {
  const retail = Number(service.price) || 0;
  if (retail <= 0) return 0;

  const normalized = normalizePartnerTier(tier);

  if (normalized === 'enterprise') {
    if (typeof service.enterprisePartnerPrice === 'number' && service.enterprisePartnerPrice > 0) {
      return Math.round(service.enterprisePartnerPrice);
    }
    return Math.round(retail * 0.50);
  }

  if (normalized === 'practice') {
    if (typeof service.practicePartnerPrice === 'number' && service.practicePartnerPrice > 0) {
      return Math.round(service.practicePartnerPrice);
    }
    return Math.round(retail * 0.70);
  }

  // Starter (10% off)
  if (typeof service.starterPartnerPrice === 'number' && service.starterPartnerPrice > 0) {
    return Math.round(service.starterPartnerPrice);
  }
  return Math.round(retail * 0.90);
}

export function buildDefaultSubscriptionForTier(tier?: PartnerTier | string | null): PartnerSubscription {
  const plan = getPartnerTierPlan(tier);
  return {
    status: 'active',
    aiCompanyLimit: plan.aiCompanyLimit,
    aiPayrollLimit: plan.aiPayrollLimit,
    staffSeatLimit: plan.staffSeatLimit,
    hasTaskManager: plan.hasTaskManager,
  };
}
