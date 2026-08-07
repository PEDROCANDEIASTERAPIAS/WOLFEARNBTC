import { useState } from 'react';
import { X, ArrowDownToLine, Zap, AlertCircle, Wallet, Clock, Info } from 'lucide-react';
import { formatSats, conversionLabel, type DisplayCurrency, type PriceData } from '../utils';

interface WithdrawModalProps {
  balanceSats: number;
  minWithdraw?: number;
  maxWithdraw?: number;
  onClose: () => void;
  onWithdraw: (destination: string, amountSats: number) => Promise<boolean>;
  displayCurrency: DisplayCurrency;
  btcPrice: PriceData | null;
  lastWithdrawalAt: string | null;
}

export function WithdrawModal({
  balanceSats,
  onClose,
  onWithdraw,
  displayCurrency,
  btcPrice,
  lastWithdrawalAt,
}: WithdrawModalProps) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Limites fixos de 1 a 20 sats
  const minWithdraw = 1;
  const maxWithdraw = 20;

  const amountNum = parseInt(amount, 10) || 0;
  const isLightningAddress = destination.includes('@') && !destination.startsWith('lnbc');
  
  const maxAllowedAmount = Math.min(Math.floor(balanceSats), maxWithdraw);

  const cooldownEnd = lastWithdrawalAt
    ? new Date(lastWithdrawalAt).getTime() + 24 * 60 * 60 * 1000
    : 0;
  const inCooldown = Date.now() < cooldownEnd;
  const cooldownEndFormatted = inCooldown
    ? new Date(cooldownEnd).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setAmount('');
      return;
    }
    const intVal = val.replace(/[^0-9]/g, '');
    setAmount(intVal);
  };

  const handleSubmit = async () => {
    setError('');
    if (!destination.trim()) {
      setError('Enter a Lightning address or LN-invoice.');
      return;
    }
    if (amountNum < minWithdraw) {
      setError(`Minimum withdrawal is ${minWithdraw} sat.`);
      return;
    }
    if (amountNum > maxWithdraw) {
      setError(`Maximum withdrawal is ${maxWithdraw} sats per transaction.`);
      return;
    }
    if (amountNum > Math.floor(balanceSats)) {
      setError('Insufficient balance.');
      return;
    }
    const ok = await onWithdraw(destination.trim(), amountNum);
    if (ok) onClose();
  };

  const setMax = () => setAmount(String(maxAllowedAmount));

  const balanceConverted = conversionLabel(balanceSats, displayCurrency, btcPrice);
  const amountConverted = conversionLabel(amountNum, displayCurrency, btcPrice);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bitcoin-500/15">
              <ArrowDownToLine className="h-5 w-5 text-bitcoin-400" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">Withdraw Sats</h2>
              <p className="text-xs text-ink-500">Instant Lightning payout</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-subtle rounded-lg p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between rounded-xl border border-ink-700 bg-ink-950/50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-ink-400">
              <Wallet className="h-4 w-4 text-bitcoin-400" />
              Available Balance
            </span>
            <div className="flex flex-col items-end">
              <span className="sats-text text-lg font-bold text-white">
                {formatSats(balanceSats)} <span className="text-sm text-ink-400">sats</span>
              </span>
              {balanceConverted && <span className="text-xs text-ink-500">{balanceConverted}</span>}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-950/30 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs text-ink-400">
              <Info className="h-3.5 w-3.5 text-bitcoin-400" />
              Range: <span className="font-semibold text-white">{minWithdraw} - {maxWithdraw} Sats</span>
            </span>
            <span className="text-ink-600">|</span>
            <span className="flex items-center gap-1.5 text-xs text-ink-400">
              <Clock className="h-3.5 w-3.5 text-bitcoin-400" />
              Limit: <span className="font-semibold text-white">1 per 24 hours</span>
            </span>
          </div>

          {inCooldown && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300 animate-fade-in">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                You've already withdrawn today. Next withdrawal available after{' '}
                <span className="font-semibold">{cooldownEndFormatted}</span>.
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Lightning Address or Invoice</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="user@walletofsatoshi.com"
                className="input"
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs text-ink-500">
                {isLightningAddress
                  ? 'Detected Lightning address'
                  : 'Paste a Lightning address (user@domain) or an LN-invoice (lnbc…)'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label">Amount (whole sats)</label>
                <button
                  onClick={setMax}
                  disabled={inCooldown}
                  className="mb-1.5 text-xs font-medium text-bitcoin-400 hover:text-bitcoin-300 disabled:opacity-40"
                >
                  Max ({maxAllowedAmount} sats)
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`1 - 20 sats (whole numbers)`}
                className="input"
                autoComplete="off"
                disabled={inCooldown}
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-ink-500">
                <span>Min: {minWithdraw} sat · Max: {maxWithdraw} sats</span>
                {amountNum > 0 && amountConverted && <span>{amountConverted}</span>}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={inCooldown}
              className="btn-gold w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="h-4 w-4" fill="currentColor" />
              Withdraw {amountNum > 0 ? formatSats(amountNum) : ''} sats
            </button>

            <p className="text-center text-xs text-ink-500">
              Lightning Network payments are instant and non-reversible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}