import { useState, useMemo } from 'react';
import { Megaphone, Globe, Zap, CheckCircle2, Copy, Link2, Loader2, Clock, Users, Calculator, Sparkles } from 'lucide-react';
import type { Campaign } from '../lib/supabase';
import { formatSats, copyToClipboard, conversionLabel, type DisplayCurrency, type PriceData } from '../utils';
import {
  calculateAdCost,
  DURATION_OPTIONS,
  getRewardOptions,
  getValidViewCounts,
  type MembershipTier,
  type TargetAudience,
} from '../lib/adPricing';
import { QRCodeImage } from './QRCodeImage';

interface AdvertiseSectionProps {
  onCreateCampaign: (campaign: Omit<Campaign, 'id' | 'status' | 'clicks_delivered' | 'created_at' | 'invoice' | 'user_id'>) => Promise<Campaign | null>;
  onActivateCampaign: (id: string) => Promise<void>;
  campaigns: Campaign[];
  membershipTier: MembershipTier;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
}

export function AdvertiseSection({
  onCreateCampaign,
  onActivateCampaign,
  campaigns,
  membershipTier,
  displayCurrency,
  btcPrice,
}: AdvertiseSectionProps) {
  const rewardOptions = getRewardOptions(membershipTier);
  const validViewCounts = getValidViewCounts();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [targetClicks, setTargetClicks] = useState<number>(1000);
  const [satsPerClick, setSatsPerClick] = useState<number>(membershipTier === 'normal' ? 1 : 5);
  const [duration, setDuration] = useState<number>(30);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
  const [generated, setGenerated] = useState<Campaign | null>(null);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const cost = useMemo(
    () => calculateAdCost(targetClicks, satsPerClick, duration, targetAudience),
    [targetClicks, satsPerClick, duration, targetAudience]
  );

  const valid = url.trim() && title.trim() && validViewCounts.includes(targetClicks) && rewardOptions.includes(satsPerClick);

  const handleGenerate = async () => {
    if (!valid) return;
    const c = await onCreateCampaign({
      advertiser_name: advertiserName.trim() || title.trim(),
      url: url.trim(),
      title: title.trim(),
      target_clicks: targetClicks,
      sats_per_click: satsPerClick,
      total_budget_sats: cost.totalCost,
      duration_sec: duration,
      target_audience: targetAudience,
    });
    if (c) {
      setGenerated(c);
      setPaid(false);
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    copyToClipboard(generated.invoice).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePay = async () => {
    setPaying(true);
    setTimeout(async () => {
      setPaying(false);
      setPaid(true);
      if (generated) {
        await onActivateCampaign(generated.id);
      }
    }, 1800);
  };

  const reset = () => {
    setGenerated(null);
    setPaid(false);
    setUrl('');
    setTitle('');
    setAdvertiserName('');
    setTargetClicks(1000);
    setSatsPerClick(membershipTier === 'normal' ? 1 : 5);
    setDuration(30);
    setTargetAudience('all');
  };

  const isTiered = membershipTier === 't1' || membershipTier === 't2';
  const tierLabel = membershipTier === 't1' ? 'T1' : membershipTier === 't2' ? 'T2' : 'Normal';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bitcoin-500/15">
            <Megaphone className="h-5 w-5 text-bitcoin-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-white">Create a Campaign</h2>
            <p className="text-sm text-ink-500">Reach thousands of Bitcoin users</p>
          </div>
          <span className={`chip ${isTiered ? 'bg-bitcoin-500/15 text-bitcoin-300' : 'bg-ink-700 text-ink-400'}`}>
            {tierLabel} Member
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Website URL</label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.com"
                className="input pl-10"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="label">Ad Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your catchy headline"
              className="input"
              autoComplete="off"
              maxLength={60}
            />
          </div>

          <div>
            <label className="label">Advertiser Name (optional)</label>
            <input
              type="text"
              value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)}
              placeholder="Your company"
              className="input"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="label">Number of Views</label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {validViewCounts.map((v) => (
                <button
                  key={v}
                  onClick={() => setTargetClicks(v)}
                  className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                    targetClicks === v
                      ? 'bg-bitcoin-500 text-ink-950'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {v >= 1000 ? `${v / 1000}k` : v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">
              Sats per Click
              {isTiered && <span className="ml-2 text-xs text-bitcoin-400">(min 5 for {tierLabel})</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {rewardOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setSatsPerClick(r)}
                  className={`min-w-[3.5rem] rounded-lg py-2 text-sm font-semibold transition-all ${
                    satsPerClick === r
                      ? 'bg-bitcoin-500 text-ink-950'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ink-500" />
              View Duration
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                    duration === d
                      ? 'bg-bitcoin-500 text-ink-950'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-ink-500" />
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTargetAudience('all')}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  targetAudience === 'all'
                    ? 'bg-bitcoin-500 text-ink-950'
                    : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                }`}
              >
                All Members
              </button>
              <button
                onClick={() => setTargetAudience('t1_t2')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  targetAudience === 't1_t2'
                    ? 'bg-bitcoin-500 text-ink-950'
                    : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                T1/T2 Only (+50%)
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-950/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-bitcoin-400" />
              <span className="text-sm font-semibold text-ink-300">Cost Breakdown</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-400">
                <span>Base ({formatSats(targetClicks)} views × {satsPerClick} sats)</span>
                <span className="sats-text text-white">{formatSats(cost.baseCost)}</span>
              </div>
              <div className="flex justify-between text-ink-400">
                <span>Volume multiplier</span>
                <span className="font-semibold text-sky-400">×{cost.volumeMultiplier.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-ink-400">
                <span>After volume discount</span>
                <span className="sats-text text-white">{formatSats(cost.volumeCost)}</span>
              </div>
              {cost.t1t2Surcharge > 0 && (
                <div className="flex justify-between text-ink-400">
                  <span>T1/T2 surcharge (+50%)</span>
                  <span className="sats-text text-amber-400">+{formatSats(cost.t1t2Surcharge)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-ink-700 pt-2">
                <span className="font-semibold text-ink-300">Total Budget</span>
                <div className="flex flex-col items-end">
                  <span className="sats-text text-xl font-bold text-bitcoin-400">
                    {formatSats(cost.totalCost)} <span className="text-sm text-ink-400">sats</span>
                  </span>
                  {conversionLabel(cost.totalCost, displayCurrency, btcPrice) && (
                    <span className="text-xs text-ink-500">{conversionLabel(cost.totalCost, displayCurrency, btcPrice)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!valid}
            className="btn-gold w-full py-3"
          >
            <Zap className="h-4 w-4" fill="currentColor" />
            Generate Lightning Invoice
          </button>
        </div>
      </div>

      <div className="card p-6">
        {!generated ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-800">
              <Zap className="h-8 w-8 text-ink-600" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink-300">
              Lightning Invoice
            </h3>
            <p className="mt-1 max-w-xs text-sm text-ink-500">
              Fill out the campaign form and generate an invoice to see your QR code and payment details here.
            </p>
          </div>
        ) : paid ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 animate-pop">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-white">Campaign Active!</h3>
            <p className="mt-1 text-sm text-ink-400">
              Your ad "{generated.title}" is now live and accepting clicks.
            </p>
            <div className="mt-4 rounded-xl border border-ink-700 bg-ink-950/50 px-4 py-3">
              <p className="text-xs text-ink-500">Budget</p>
              <p className="sats-text text-lg font-bold text-bitcoin-400">
                {formatSats(generated.total_budget_sats)} sats
              </p>
            </div>
            <button onClick={reset} className="btn-ghost mt-6 px-5 py-2.5">
              Create another campaign
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h3 className="font-display text-lg font-bold text-white">Pay to Activate</h3>
            <p className="mt-1 text-sm text-ink-500">Scan or paste this Lightning invoice</p>

            <div className="mt-5 rounded-2xl border border-ink-700 bg-white p-4">
              <QRCodeImage value={generated.invoice} size={200} />
            </div>

            <div className="mt-4 w-full">
              <div className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-950/50 p-3">
                <Link2 className="h-4 w-4 shrink-0 text-ink-500" />
                <span className="truncate font-mono text-xs text-ink-300">{generated.invoice}</span>
                <button
                  onClick={handleCopy}
                  className="ml-auto shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-bitcoin-400"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-ink-700 bg-ink-950/50 px-3 py-2.5 text-center">
                <p className="text-xs text-ink-500">Amount</p>
                <p className="sats-text text-sm font-bold text-white">{formatSats(generated.total_budget_sats)}</p>
              </div>
              <div className="rounded-xl border border-ink-700 bg-ink-950/50 px-3 py-2.5 text-center">
                <p className="text-xs text-ink-500">Views</p>
                <p className="sats-text text-sm font-bold text-white">{formatSats(generated.target_clicks)}</p>
              </div>
              <div className="rounded-xl border border-ink-700 bg-ink-950/50 px-3 py-2.5 text-center">
                <p className="text-xs text-ink-500">Per click</p>
                <p className="sats-text text-sm font-bold text-white">{formatSats(generated.sats_per_click)}</p>
              </div>
              <div className="rounded-xl border border-ink-700 bg-ink-950/50 px-3 py-2.5 text-center">
                <p className="text-xs text-ink-500">Duration</p>
                <p className="sats-text text-sm font-bold text-white">{generated.duration_sec}s</p>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-gold mt-5 w-full py-3"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for payment…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" fill="currentColor" />
                  Simulate Payment
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {campaigns.length > 0 && (
        <div className="card lg:col-span-2 p-6">
          <h3 className="mb-4 font-display text-base font-bold text-white">Active Campaigns</h3>
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-950/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{c.title}</p>
                  <p className="truncate text-xs text-ink-500">{c.advertiser_name} · {c.url}</p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-ink-500">Delivered</p>
                    <p className="sats-text text-sm font-semibold text-white">
                      {formatSats(c.clicks_delivered)}/{formatSats(c.target_clicks)}
                    </p>
                  </div>
                  <span
                    className={`chip ${
                      c.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : c.status === 'pending_payment'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-ink-700 text-ink-400'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
