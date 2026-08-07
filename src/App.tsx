import { useEffect, useState } from 'react';
import { Zap, MousePointerClick, Megaphone, Users, ArrowUp, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useStore } from './store';
import { Header } from './components/Header';
import { StatsSummary, BalanceHero } from './components/StatsSummary';
import { AdGrid } from './components/AdCard';
import { AdViewerModal } from './components/AdViewerModal';
import { WithdrawModal } from './components/WithdrawModal';
import { AdvertiseSection } from './components/AdvertiseSection';
import { ReferralSection } from './components/ReferralSection';
import { AdminPanel } from './components/AdminPanel';
import { ToastStack } from './components/ToastStack';
import { AuthScreen } from './components/AuthScreen';
import type { Ad } from './lib/supabase';
import { formatSats, conversionLabel, type DisplayCurrency } from './utils';
import type { MembershipTier } from './lib/adPricing';

type Tab = 'dashboard' | 'advertise' | 'referrals';

function WolfearnBTCApp() {
  const { profile, loading, signOut } = useAuth();
  const store = useStore();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [watchingAd, setWatchingAd] = useState<Ad | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    if (profile?.is_admin && adminMode) {
      store.fetchAdminData();
    }
  }, [profile?.is_admin, adminMode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-bitcoin-500" />
          <p className="text-sm text-ink-400">Loading WolfearnBTC…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <AuthScreen />;
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: MousePointerClick },
    { id: 'advertise', label: 'Advertise', icon: Megaphone },
    { id: 'referrals', label: 'Referrals', icon: Users },
  ];

  return (
    <div className="min-h-screen">
      <Header
        user={profile}
        onWithdraw={() => setShowWithdraw(true)}
        onSignOut={signOut}
        onAdminToggle={() => setAdminMode((a) => !a)}
        adminMode={adminMode}
        displayCurrency={store.displayCurrency}
        btcPrice={store.btcPrice}
        onCurrencyChange={store.updateCurrencyPreference}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {adminMode && profile.is_admin ? (
          <div className="animate-fade-in">
            <AdminPanel
              stats={store.adminStats}
              pendingAds={store.pendingAds}
              allAds={store.allAds}
              adminUsers={store.adminUsers}
              campaigns={store.campaigns}
              withdrawals={store.withdrawals}
              onApproveAd={store.approveAd}
              onRejectAd={store.rejectAd}
              onToggleBan={store.toggleBanUser}
              onCreateAd={store.adminCreateAd}
              onUpdateAd={store.adminUpdateAd}
              onDeleteAd={store.adminDeleteAd}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-1 rounded-xl border border-ink-800 bg-ink-900/50 p-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      tab === t.id
                        ? 'bg-bitcoin-500/15 text-bitcoin-400 shadow-[inset_0_0_0_1px_rgba(247,147,26,0.3)]'
                        : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <BalanceHero user={profile} displayCurrency={store.displayCurrency} btcPrice={store.btcPrice} />
                <StatsSummary user={profile} displayCurrency={store.displayCurrency} btcPrice={store.btcPrice} />
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-white">Available Ads</h2>
                    <span className="chip bg-ink-800 text-ink-400">
                      <Zap className="h-3 w-3 text-bitcoin-400" fill="currentColor" />
                      {store.ads.length} live
                    </span>
                  </div>
                  {store.loadingAds ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-bitcoin-500" />
                    </div>
                  ) : (
                    <AdGrid ads={store.ads} onWatch={(ad) => setWatchingAd(ad)} displayCurrency={store.displayCurrency} btcPrice={store.btcPrice} />
                  )}
                </div>
              </div>
            )}

            {tab === 'advertise' && (
              <div className="animate-fade-in">
                <AdvertiseSection
                  onCreateCampaign={store.createCampaign}
                  onActivateCampaign={store.activateCampaign}
                  campaigns={store.campaigns}
                  membershipTier={(profile.membership_tier as MembershipTier) || 'normal'}
                  displayCurrency={store.displayCurrency}
                  btcPrice={store.btcPrice}
                />
              </div>
            )}

            {tab === 'referrals' && (
              <div className="animate-fade-in">
                <ReferralSection user={profile} referralBonus={store.referralBonus} displayCurrency={store.displayCurrency} btcPrice={store.btcPrice} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-ink-800/60 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <Zap className="h-4 w-4 text-bitcoin-500" fill="currentColor" />
            <span>WolfearnBTC — Earn Bitcoin by clicking. Powered by Lightning.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-600">
            <span>Built for the Lightning Network</span>
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              Connected to Supabase + LNbits
            </span>
          </div>
        </div>
      </footer>

      {watchingAd && (
        <AdViewerModal
          ad={watchingAd}
          onClose={() => setWatchingAd(null)}
          onClaim={store.claimAd}
          displayCurrency={store.displayCurrency}
          btcPrice={store.btcPrice}
        />
      )}

      {showWithdraw && (
        <WithdrawModal
          balanceSats={profile.sats_balance}
          minWithdraw={store.minWithdraw}
          onClose={() => setShowWithdraw(false)}
          onWithdraw={store.requestWithdraw}
          displayCurrency={store.displayCurrency}
          btcPrice={store.btcPrice}
          lastWithdrawalAt={profile.last_withdrawal_at}
        />
      )}

      {store.floatReward && (
        <div
          key={store.floatReward.id}
          className="pointer-events-none fixed left-1/2 top-1/3 z-[150] -translate-x-1/2 animate-float-up"
        >
          <div className="flex items-center gap-2 rounded-full bg-bitcoin-500/20 px-4 py-2 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-bitcoin-400" fill="currentColor" />
            <span className="sats-text text-xl font-bold text-bitcoin-400">
              +{formatSats(store.floatReward.amount)}
            </span>
            {conversionLabel(store.floatReward.amount, store.displayCurrency, store.btcPrice) && (
              <span className="text-sm font-medium text-bitcoin-300/70">
                {conversionLabel(store.floatReward.amount, store.displayCurrency, store.btcPrice)}
              </span>
            )}
          </div>
        </div>
      )}

      <ToastStack toasts={store.toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WolfearnBTCApp />
    </AuthProvider>
  );
}
