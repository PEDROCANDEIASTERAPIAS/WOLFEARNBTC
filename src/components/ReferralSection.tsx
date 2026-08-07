import { useState } from 'react';
import { Users, Copy, CheckCircle2, Gift, Link2, TrendingUp } from 'lucide-react';
import type { Profile } from '../lib/supabase';
import { formatSats, copyToClipboard, conversionLabel, type DisplayCurrency, type PriceData } from '../utils';

interface ReferralSectionProps {
  user: Profile;
  referralBonus: number;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
}

export function ReferralSection({ user, referralBonus, displayCurrency, btcPrice }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://wolfearnbtc.app/r/${user.referral_code}`;

  const handleCopy = () => {
    copyToClipboard(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const activeCount = 0;
  const totalEarned = user.referral_earnings_sats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bitcoin-500/15">
              <Users className="h-5 w-5 text-bitcoin-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Your Referral Link</h2>
              <p className="text-sm text-ink-500">
                Earn {Math.round(referralBonus * 100)}% of every referral's earnings, forever
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-ink-700 bg-ink-950/50 px-4 py-3">
              <Link2 className="h-4 w-4 shrink-0 text-ink-500" />
              <span className="truncate text-sm text-ink-200">{referralLink}</span>
            </div>
            <button onClick={handleCopy} className="btn-gold px-5 py-3 whitespace-nowrap">
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-ink-950" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-bitcoin-500/20 bg-bitcoin-500/5 px-4 py-3">
            <Gift className="h-4 w-4 text-bitcoin-400" />
            <span className="text-sm text-ink-300">
              Your code: <span className="font-mono font-semibold text-bitcoin-400">{user.referral_code}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="card card-hover p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                <Users className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-500">Active Referrals</p>
                <p className="sats-text text-2xl font-bold text-white">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="card card-hover p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-500">Bonus Earned</p>
                <p className="sats-text text-2xl font-bold text-white">
                  {formatSats(totalEarned)} <span className="text-sm text-ink-400">sats</span>
                </p>
                {conversionLabel(totalEarned, displayCurrency, btcPrice) && (
                  <p className="text-xs text-ink-500">{conversionLabel(totalEarned, displayCurrency, btcPrice)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-display text-base font-bold text-white">Referral Program</h3>
        <p className="text-sm text-ink-400">
          Share your referral link and earn {Math.round(referralBonus * 100)}% of every referral's earnings,
          automatically. Your referral stats will appear here once your network starts clicking.
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-bitcoin-500/20 bg-bitcoin-500/5 px-4 py-3">
          <Gift className="h-5 w-5 text-bitcoin-400" />
          <div>
            <p className="text-xs text-ink-500">Lifetime referral bonus</p>
            <p className="sats-text text-lg font-bold text-bitcoin-400">{formatSats(totalEarned)} sats</p>
          </div>
        </div>
      </div>
    </div>
  );
}
