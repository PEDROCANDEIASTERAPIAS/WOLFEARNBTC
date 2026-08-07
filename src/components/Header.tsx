import { Zap, ArrowDownToLine, ShieldCheck, Settings2 } from 'lucide-react';
import { useState } from 'react';
import type { Profile } from '../lib/supabase';
import { Avatar } from './Avatar';
import { formatSats, conversionLabel, CURRENCY_OPTIONS, currencyMeta, type DisplayCurrency, type PriceData } from '../utils';

interface HeaderProps {
  user: Profile;
  onWithdraw: () => void;
  onSignOut: () => void;
  onAdminToggle: () => void;
  adminMode: boolean;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
  onCurrencyChange: (c: DisplayCurrency) => void;
}

export function Header({ user, onWithdraw, onSignOut, onAdminToggle, adminMode, displayCurrency, btcPrice, onCurrencyChange }: HeaderProps) {
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const converted = conversionLabel(user.sats_balance, displayCurrency, btcPrice);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-bitcoin-500 shadow-lg shadow-bitcoin-500/30 transition-transform group-hover:scale-105">
              <Zap className="h-5 w-5 text-ink-950" fill="currentColor" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Wolfearn<span className="text-bitcoin-400">BTC</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-ink-500">
                Hunt Sats at Lightning Speed
              </span>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end leading-tight">
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2 sm:px-4">
              <Zap className="h-4 w-4 text-bitcoin-400" fill="currentColor" />
              <span className="sats-text text-sm font-semibold text-white sm:text-base">
                {formatSats(user.sats_balance)}
              </span>
              <span className="text-xs font-medium text-ink-400">Sats</span>
            </div>
            {converted && (
              <span className="mr-1 mt-0.5 text-[11px] text-ink-500">{converted}</span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu((s) => !s)}
              className="btn-subtle rounded-lg p-2"
              title="Display currency"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            {showCurrencyMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCurrencyMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl animate-scale-in">
                  <p className="border-b border-ink-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Display Currency
                  </p>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onCurrencyChange(opt.value);
                        setShowCurrencyMenu(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        displayCurrency === opt.value
                          ? 'bg-bitcoin-500/15 text-bitcoin-400'
                          : 'text-ink-300 hover:bg-ink-800/60'
                      }`}
                    >
                      <span className="text-base">{opt.symbol}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={onWithdraw} className="btn-gold px-3 py-2 text-sm sm:px-4">
            <ArrowDownToLine className="h-4 w-4" />
            <span className="hidden sm:inline">Withdraw</span>
          </button>

          {user.is_admin && (
            <button
              onClick={onAdminToggle}
              className={`btn px-3 py-2 text-sm transition-colors ${
                adminMode
                  ? 'bg-bitcoin-500/15 text-bitcoin-400 ring-1 ring-bitcoin-500/40'
                  : 'text-ink-400 hover:bg-ink-800/60 hover:text-ink-100'
              }`}
              title="Admin panel"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          <button onClick={onSignOut} className="flex items-center gap-2 rounded-xl p-0.5 transition-transform hover:scale-105" title="Sign out">
            <Avatar hue={user.avatar_hue} size={36} />
          </button>
        </div>
      </div>
    </header>
  );
}
