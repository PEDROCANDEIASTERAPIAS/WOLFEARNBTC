import { useState } from 'react';
import { Zap, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, username);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-bitcoin-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-bitcoin-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bitcoin-500 shadow-lg shadow-bitcoin-500/30 animate-glow-pulse">
            <Zap className="h-7 w-7 text-ink-950" fill="currentColor" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-white">
            Sats<span className="text-bitcoin-400">Click</span>
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Earn Bitcoin by watching ads. Withdraw instantly via Lightning.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex rounded-xl border border-ink-800 bg-ink-950/50 p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-bitcoin-500/15 text-bitcoin-400 shadow-[inset_0_0_0_1px_rgba(247,147,26,0.3)]'
                  : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-bitcoin-500/15 text-bitcoin-400 shadow-[inset_0_0_0_1px_rgba(247,147,26,0.3)]'
                  : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="satoshi_clicker"
                    className="input pl-10"
                    required
                    minLength={3}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-gold w-full py-3">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-500">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-medium text-bitcoin-400 hover:text-bitcoin-300"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-medium text-bitcoin-400 hover:text-bitcoin-300"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-ink-600">
          By signing up you agree to earn sats by watching ads. No KYC required.
        </p>
      </div>
    </div>
  );
}
