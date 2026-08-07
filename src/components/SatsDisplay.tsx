import type { DisplayCurrency, PriceData } from '../utils';
import { conversionLabel, currencyMeta } from '../utils';

interface SatsDisplayProps {
  sats: number;
  currency: DisplayCurrency;
  price: PriceData | null;
  className?: string;
  showSymbol?: boolean;
}

export function SatsDisplay({ sats, currency, price, className, showSymbol = false }: SatsDisplayProps) {
  const converted = conversionLabel(sats, currency, price);
  const meta = currencyMeta(currency);
  return (
    <span className={className}>
      {showSymbol && <span className="mr-1 opacity-60">{meta.symbol}</span>}
      {sats.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      <span className="ml-1 text-xs font-normal text-ink-400">Sats</span>
      {converted && <span className="ml-2 text-xs font-normal text-ink-500">{converted}</span>}
    </span>
  );
}
