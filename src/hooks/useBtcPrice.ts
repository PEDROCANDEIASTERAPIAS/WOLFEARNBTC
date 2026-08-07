import { useEffect, useState, useCallback } from 'react';
import type { PriceData } from '../utils';

const PRICE_CACHE_KEY = 'wolfearnbtc_btc_price';
const CACHE_TTL = 5 * 60 * 1000;

export function useBtcPrice() {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrice = useCallback(async () => {
    try {
      const cached = localStorage.getItem(PRICE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { data: PriceData; ts: number };
        if (Date.now() - parsed.ts < CACHE_TTL) {
          setPrice(parsed.data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur');
      if (!res.ok) throw new Error('price fetch failed');
      const json = await res.json();
      const data: PriceData = {
        usd: json.bitcoin?.usd ?? 0,
        eur: json.bitcoin?.eur ?? 0,
      };
      setPrice(data);
      setLoading(false);
      localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      const fallback: PriceData = { usd: 65000, eur: 60000 };
      setPrice(fallback);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, loading, refetch: fetchPrice };
}
