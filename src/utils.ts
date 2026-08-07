export type DisplayCurrency = 'sats' | 'btc' | 'usd' | 'eur';

export const CURRENCY_OPTIONS: { value: DisplayCurrency; label: string; symbol: string }[] = [
  { value: 'sats', label: 'Sats', symbol: '⚡' },
  { value: 'btc', label: 'BTC', symbol: '₿' },
  { value: 'usd', label: 'USD', symbol: '$' },
  { value: 'eur', label: 'EUR', symbol: '€' },
];

export function currencyMeta(code: DisplayCurrency) {
  return CURRENCY_OPTIONS.find((c) => c.value === code) ?? CURRENCY_OPTIONS[0];
}

const SATS_PER_BTC = 100_000_000;

export type PriceData = {
  usd: number;
  eur: number;
};

export function formatSats(n: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatSatsPlain(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

export function satsToBtc(sats: number): string {
  return (sats / SATS_PER_BTC).toFixed(8);
}

export function currencySymbol(code: DisplayCurrency): string {
  return currencyMeta(code).symbol;
}

export function convertSats(sats: number, currency: DisplayCurrency, price: PriceData | null): string {
  if (currency === 'sats') return '';
  if (!price) return '—';
  const btcAmount = sats / SATS_PER_BTC;
  if (currency === 'btc') {
    return btcAmount.toFixed(8);
  }
  const fiatRate = currency === 'usd' ? price.usd : price.eur;
  const fiatAmount = btcAmount * fiatRate;
  return fiatAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatFiatEstimate(sats: number, currency: DisplayCurrency, price: PriceData | null): string {
  if (!price || currency === 'sats' || currency === 'btc') return '';
  const converted = convertSats(sats, currency, price);
  if (converted === '—' || !converted) return '';
  const sym = currencySymbol(currency);
  return currency === 'eur' ? `~${converted} ${sym}` : `~${sym}${converted}`;
}

export function conversionLabel(sats: number, currency: DisplayCurrency, price: PriceData | null): string {
  const satsFormatted = formatSats(sats);
  const btcFormatted = satsToBtc(sats);
  const fiatEstimate = formatFiatEstimate(sats, currency, price);

  if (fiatEstimate) {
    return `${satsFormatted} Sats | ${btcFormatted} BTC (${fiatEstimate})`;
  }
  return `${satsFormatted} Sats | ${btcFormatted} BTC`;
}

export function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function generateLightningInvoice(amountSats: number, memo: string): string {
  const rand = Math.random().toString(36).slice(2, 18);
  return `lnbc${amountSats}n1p3q${rand}djk2p...${memo.replace(/\s/g, '').slice(0, 6).toLowerCase()}q9j2k`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject();
}