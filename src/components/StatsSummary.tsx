import { TrendingUp, MousePointerClick, Users, Zap } from 'lucide-react';
import type { Profile } from '../lib/supabase';
import { formatSats, conversionLabel, type DisplayCurrency, type PriceData } from '../utils';

interface StatsSummaryProps {
  user: Profile;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
}

export function StatsSummary({ user, displayCurrency, btcPrice }: StatsSummaryProps) {
  const stats = [
    {
      label: 'Total Earned',
      sats: user.total_earned_sats,
      unit: 'Sats',
      icon: TrendingUp,
      accent: 'text-bitcoin-400',
      bg: 'bg-bitcoin-500/10',
      ring: 'ring-bitcoin-500/20',
    },
    {
      label: 'Ads Clicked',
      sats: user.ads_clicked,
      unit: 'clicks',
      icon: MousePointerClick,
      accent: 'text-sky-400',
      bg: 'bg-sky-500/10',
      ring: 'ring-sky-500/20',
      isCount: true,
    },
    {
      label: 'Referral Earnings',
      sats: user.referral_earnings_sats,
      unit: 'Sats',
      icon: Users,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => {
        const Icon = s.icon;
        const converted = s.isCount ? '' : conversionLabel(s.sats, displayCurrency, btcPrice);
        return (
          <div
            key={s.label}
            className={`card card-hover flex items-center gap-4 p-5 ring-1 ${s.ring}`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
              <Icon className={`h-6 w-6 ${s.accent}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-500">{s.label}</p>
              <p className="sats-text mt-0.5 text-2xl font-bold text-white">
                {formatSats(s.sats)}
                <span className="ml-1.5 text-sm font-medium text-ink-400">{s.unit}</span>
              </p>
              {converted && <p className="mt-0.5 text-xs text-ink-500">{converted}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface BalanceHeroProps {
  user: Profile;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
}

export function BalanceHero({ user, displayCurrency, btcPrice }: BalanceHeroProps) {
  const converted = conversionLabel(user.sats_balance, displayCurrency, btcPrice);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-bitcoin-500/20 bg-gradient-to-br from-bitcoin-500/10 via-ink-900/60 to-ink-900/60 p-6 sm:p-8">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-bitcoin-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-bitcoin-400">
            <Zap className="h-4 w-4" fill="currentColor" />
            <span className="text-xs font-semibold uppercase tracking-widest">Available Balance</span>
          </div>
          <p className="sats-text mt-2 text-4xl font-bold text-white sm:text-5xl">
            {formatSats(user.sats_balance)}
            <span className="ml-2 text-xl font-medium text-ink-400">Sats</span>
          </p>
          {converted ? (
            <p className="mt-1 text-sm text-ink-400">
              {converted} · Withdraw anytime via Lightning
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-400">
              ~{(user.sats_balance / 100000000).toFixed(8)} BTC · Withdraw anytime via Lightning
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="chip bg-emerald-500/15 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Lightning connected
          </span>
          <span className="text-xs text-ink-500">Powered by LNbits</span>
        </div>
      </div>
    </div>
  );
}
