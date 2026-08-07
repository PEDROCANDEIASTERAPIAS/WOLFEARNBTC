export type MembershipTier = 'normal' | 't1' | 't2';
export type TargetAudience = 'all' | 't1_t2';

export const REWARD_OPTIONS_NORMAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 75, 100];
export const REWARD_OPTIONS_TIERED = [5, 6, 7, 8, 9, 10, 25, 50, 75, 100];

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const VOLUME_TIERS: { views: number; multiplier: number }[] = [
  { views: 100, multiplier: 2.0 },
  { views: 250, multiplier: 2.0 },
  { views: 500, multiplier: 1.9 },
  { views: 1000, multiplier: 1.8 },
  { views: 2500, multiplier: 1.7 },
  { views: 5000, multiplier: 1.6 },
  { views: 10000, multiplier: 1.5 },
];

export const T1T2_SURCHARGE = 0.5;

export function getRewardOptions(tier: MembershipTier): number[] {
  return tier === 't1' || tier === 't2' ? REWARD_OPTIONS_TIERED : REWARD_OPTIONS_NORMAL;
}

export function getVolumeMultiplier(views: number): number {
  let multiplier = VOLUME_TIERS[VOLUME_TIERS.length - 1].multiplier;
  for (const t of VOLUME_TIERS) {
    if (views >= t.views) {
      multiplier = t.multiplier;
    }
  }
  return multiplier;
}

export function getValidViewCounts(): number[] {
  return VOLUME_TIERS.map((t) => t.views);
}

export function isAllowedViewCount(views: number): boolean {
  return VOLUME_TIERS.some((t) => t.views === views);
}

export interface AdCostBreakdown {
  baseCost: number;
  volumeMultiplier: number;
  volumeCost: number;
  t1t2Surcharge: number;
  totalCost: number;
  perClick: number;
  views: number;
  durationSec: number;
  targetAudience: TargetAudience;
}

export function calculateAdCost(
  views: number,
  perClick: number,
  durationSec: number,
  targetAudience: TargetAudience
): AdCostBreakdown {
  const baseCost = views * perClick;
  const volumeMultiplier = getVolumeMultiplier(views);
  const volumeCost = Math.round(baseCost * volumeMultiplier);
  const t1t2Surcharge =
    targetAudience === 't1_t2' ? Math.round(volumeCost * T1T2_SURCHARGE) : 0;
  const totalCost = volumeCost + t1t2Surcharge;

  return {
    baseCost,
    volumeMultiplier,
    volumeCost,
    t1t2Surcharge,
    totalCost,
    perClick,
    views,
    durationSec,
    targetAudience,
  };
}
