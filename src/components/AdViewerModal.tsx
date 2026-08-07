import { useCallback, useMemo, useState } from 'react';
import { X, Zap, ShieldCheck, ExternalLink, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Ad } from '../lib/supabase';
import { useCountdown } from '../hooks/useCountdown';
import { formatSats, conversionLabel, type DisplayCurrency, type PriceData } from '../utils';

interface AdViewerModalProps {
  ad: Ad;
  onClose: () => void;
  onClaim: (ad: Ad) => Promise<void> | void;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
}

type Phase = 'watching' | 'verify' | 'claimed';

interface MathCaptcha {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

function makeMathCaptcha(): MathCaptcha {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  const answer = a + b;
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    options.add(answer + (Math.floor(Math.random() * 6) - 3 + (Math.random() > 0.5 ? 1 : -1) * 2));
  }
  return {
    a,
    b,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

export function AdViewerModal({ ad, onClose, onClaim, displayCurrency, btcPrice }: AdViewerModalProps) {
  const [phase, setPhase] = useState<Phase>('watching');
  const [captcha] = useState<MathCaptcha>(() => makeMathCaptcha());
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);

  const handleComplete = useCallback(() => {
    setPhase('verify');
  }, []);

  const { remaining } = useCountdown({
    duration: ad.duration_sec,
    onComplete: handleComplete,
    active: phase === 'watching',
  });

  const progress = useMemo(() => {
    if (phase !== 'watching') return 100;
    return ((ad.duration_sec - remaining) / ad.duration_sec) * 100;
  }, [phase, remaining, ad.duration_sec]);

  const handleSelect = (val: number) => {
    setSelected(val);
    if (val === captcha.answer) {
      setWrong(false);
      setPhase('claimed');
      onClaim(ad);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 600);
    }
  };

  const fiatEstimate = useMemo(() => {
    if (!btcPrice) return null;
    const rate = displayCurrency === 'eur' ? btcPrice.eur : btcPrice.usd;
    const symbol = displayCurrency === 'eur' ? '€' : '$';
    if (!rate) return null;
    const btcAmount = (ad.reward_sats || 0) / 100000000;
    const fiatValue = btcAmount * rate;
    return `~${symbol}${fiatValue.toFixed(2)}`;
  }, [ad.reward_sats, displayCurrency, btcPrice]);

  const btcFormatted = ((ad.reward_sats || 0) / 100000000).toFixed(8);
  const rewardConverted = conversionLabel(ad.reward_sats, displayCurrency, btcPrice);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bitcoin-500/15">
              <ExternalLink className="h-4 w-4 text-bitcoin-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{ad.title}</p>
              <p className="truncate text-xs text-ink-500">{ad.domain}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-subtle rounded-lg p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {phase === 'watching' && (
          <div>
            <div className="relative h-56 sm:h-72">
              <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#F7931A"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="sats-text text-3xl font-bold text-white">{remaining}</span>
                    <span className="text-xs font-medium uppercase tracking-wider text-ink-400">sec</span>
                  </div>
                </div>

                <div className="rounded-lg bg-ink-950/70 px-4 py-2 text-center backdrop-blur-sm">
                  <p className="text-sm font-semibold text-bitcoin-400">
                    +{formatSats(ad.reward_sats)} Sats <span className="text-ink-500">|</span> {btcFormatted} BTC
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {fiatEstimate && <span>{fiatEstimate} · </span>}Withdraw anytime via Lightning
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-ink-400">{ad.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
                <ShieldCheck className="h-4 w-4 text-ink-600" />
                Stay on this page — a quick verification appears when the timer ends.
              </div>
            </div>
          </div>
        )}

        {phase === 'verify' && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bitcoin-500/15">
              <ShieldCheck className="h-7 w-7 text-bitcoin-400" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-white">Quick verification</h3>
            <p className="mt-1 text-sm text-ink-400">
              Solve this to prove you're human and claim your reward.
            </p>
            <div className="mt-6">
              <p className="sats-text text-3xl font-bold text-white">
                {captcha.a} + {captcha.b} = ?
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {captcha.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`btn-ghost h-14 text-lg font-bold transition-all ${
                    selected === opt && wrong
                      ? 'border-red-500/60 bg-red-500/15 text-red-300 animate-pop'
                      : ''
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {wrong && (
              <p className="mt-4 text-sm text-red-400 animate-fade-in">
                Not quite — try again.
              </p>
            )}
          </div>
        )}

        {phase === 'claimed' && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 animate-pop">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold text-white">Reward claimed!</h3>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-bitcoin-500/10 px-5 py-3">
              <Zap className="h-5 w-5 text-bitcoin-400" fill="currentColor" />
              <span className="sats-text text-2xl font-bold text-bitcoin-400">
                +{formatSats(ad.reward_sats)} sats
              </span>
            </div>
            {rewardConverted && (
              <p className="mt-1 text-sm text-ink-400">{rewardConverted}</p>
            )}
            <p className="mt-2 text-sm text-ink-400">Added to your balance instantly.</p>
            <button onClick={onClose} className="btn-gold mt-6 px-6 py-2.5">
              <RotateCcw className="h-4 w-4" />
              Back to ads
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
