import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { Toast } from '../store';

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-slide-up ${
            t.kind === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-100'
              : t.kind === 'error'
              ? 'border-red-500/30 bg-red-950/80 text-red-100'
              : 'border-ink-700 bg-ink-900/90 text-ink-100'
          }`}
        >
          {t.kind === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          {t.kind === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
          {t.kind === 'info' && <Info className="h-5 w-5 text-bitcoin-400" />}
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export function ToastDismissX() {
  return <X className="h-4 w-4" />;
}
