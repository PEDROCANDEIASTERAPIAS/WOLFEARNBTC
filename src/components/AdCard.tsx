import React from 'react';
import { ExternalLink, Clock, Zap } from 'lucide-react';
import type { Ad } from '../lib/supabase';
import { conversionLabel, type DisplayCurrency, type PriceData } from '../utils';

interface AdCardProps {
  ad: Ad;
  onWatch: (ad: Ad) => void;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
}

export function AdCard({ ad, onWatch, displayCurrency, btcPrice }: AdCardProps) {
  return (
    <div
      onClick={() => onWatch(ad)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-bitcoin-500/50 hover:bg-ink-900/80 hover:shadow-xl hover:shadow-bitcoin-500/5 flex flex-col justify-between"
    >
      <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl bg-ink-800">
        <img
          src={ad.image_url || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80'}
          alt={ad.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent opacity-60" />

        <span className="absolute left-2.5 top-2.5 rounded-md bg-ink-950/80 px-2 py-0.5 text-[10px] font-semibold text-ink-300 backdrop-blur-sm border border-ink-800/50 uppercase tracking-wider">
          {ad.category || 'Crypto'}
        </span>

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-bitcoin-500/90 px-2.5 py-1 text-xs font-bold text-ink-950 shadow-lg backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>+{ad.reward_sats}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-bitcoin-400 font-medium">
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{ad.domain}</span>
        </div>
        <h3 className="font-display text-base font-bold text-white group-hover:text-bitcoin-400 transition-colors line-clamp-1">
          {ad.title}
        </h3>
        <p className="text-xs text-ink-400 line-clamp-2 leading-relaxed">
          {ad.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-800/50 pt-3 text-[11px] text-ink-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{ad.duration_sec}s</span>
        </div>
        <div>
          <span>{ad.clicks_remaining.toLocaleString()} left</span>
        </div>
      </div>
    </div>
  );
}

export function AdGrid({ ads, onWatch, displayCurrency, btcPrice }: { ads: Ad[]; onWatch: (ad: Ad) => void; displayCurrency: DisplayCurrency; btcPrice: PriceData | null }) {
  if (!ads || ads.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-800/60 bg-ink-900/20 p-12 text-center">
        <p className="text-sm text-ink-400">No active ads available right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} onWatch={onWatch} displayCurrency={displayCurrency} btcPrice={btcPrice} />
      ))}
    </div>
  );
}