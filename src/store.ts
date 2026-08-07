import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, type Ad, type Profile, type Campaign, type Withdrawal } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useBtcPrice } from './hooks/useBtcPrice';
import type { DisplayCurrency, PriceData } from './utils';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const MIN_WITHDRAW = 20;
const WITHDRAW_COOLDOWN_HOURS = 24;
const REFERRAL_BONUS = 0.1;

export function useStore() {
  const { profile, refreshProfile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [adminUsers, setAdminUsers] = useState<Profile[]>([]);
  const [adminStats, setAdminStats] = useState({
    totalRevenueSats: 0,
    totalPayoutsSats: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    totalAdsServed: 0,
  });
  const [loadingAds, setLoadingAds] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [floatReward, setFloatReward] = useState<{ id: number; amount: number } | null>(null);
  const toastId = useRef(0);
  const floatId = useRef(0);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const pushFloat = useCallback((amount: number) => {
    const id = ++floatId.current;
    setFloatReward({ id, amount });
    setTimeout(() => setFloatReward(null), 1200);
  }, []);

  const fetchAds = useCallback(async () => {
    setLoadingAds(true);
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      pushToast('error', 'Failed to load ads.');
      setLoadingAds(false);
      return;
    }
    const fetched = data as Ad[];
    setAllAds(fetched);
    setAds(fetched.filter((a) => a.status === 'active'));
    setPendingAds(fetched.filter((a) => a.status === 'pending'));
    setLoadingAds(false);
  }, [pushToast]);

  const fetchCampaigns = useCallback(async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setCampaigns(data as Campaign[]);
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setWithdrawals(data as Withdrawal[]);
  }, []);

  useEffect(() => {
    fetchAds();
    fetchCampaigns();
    fetchWithdrawals();
  }, [fetchAds, fetchCampaigns, fetchWithdrawals]);

  const claimAd = useCallback(
    async (ad: Ad) => {
      const { data, error } = await supabase.rpc('record_ad_view', { p_ad_id: ad.id });
      if (error) {
        pushToast('error', 'Failed to record ad view.');
        return;
      }
      const reward = data as number;
      pushFloat(reward);
      pushToast('success', `+${reward} sats earned!`);
      await refreshProfile();
      setAds((prev) =>
        prev.map((a) =>
          a.id === ad.id ? { ...a, clicks_remaining: Math.max(0, a.clicks_remaining - 1) } : a
        )
      );
    },
    [pushFloat, pushToast, refreshProfile]
  );

  const requestWithdraw = useCallback(
    async (destination: string, amountSats: number): Promise<boolean> => {
      if (!destination.trim()) {
        pushToast('error', 'Enter a Lightning address or invoice.');
        return false;
      }
      const wholeAmount = Math.floor(amountSats);
      if (wholeAmount !== amountSats) {
        pushToast('error', 'Withdrawal amount must be a whole number (no decimals).');
        return false;
      }
      if (wholeAmount < MIN_WITHDRAW) {
        pushToast('error', `Minimum withdrawal is ${MIN_WITHDRAW} sats.`);
        return false;
      }
      if (profile && wholeAmount > Math.floor(profile.sats_balance)) {
        pushToast('error', 'Insufficient balance.');
        return false;
      }
      if (profile?.last_withdrawal_at) {
        const lastTime = new Date(profile.last_withdrawal_at).getTime();
        const nextAllowed = lastTime + WITHDRAW_COOLDOWN_HOURS * 60 * 60 * 1000;
        if (Date.now() < nextAllowed) {
          const waitUntil = new Date(nextAllowed).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
          pushToast('error', `You can withdraw again after ${waitUntil}. Limit: 1 withdrawal per day.`);
          return false;
        }
      }
      const { data, error } = await supabase.rpc('process_withdrawal', {
        p_destination: destination.trim(),
        p_amount_sats: wholeAmount,
      });
      if (error) {
        pushToast('error', error.message || 'Withdrawal failed.');
        return false;
      }
      pushToast('success', `${wholeAmount} sats sent to ${destination}`);
      await refreshProfile();
      await fetchWithdrawals();
      return true;
    },
    [profile, pushToast, refreshProfile, fetchWithdrawals]
  );

  const createCampaign = useCallback(
    async (
      campaign: Omit<Campaign, 'id' | 'status' | 'clicks_delivered' | 'created_at' | 'invoice' | 'user_id'>
    ): Promise<Campaign | null> => {
      const invoice =
        'lnbc' + campaign.total_budget_sats + 'n1p3q' + Math.random().toString(36).slice(2, 14) + '...q9j2k';
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          advertiser_name: campaign.advertiser_name,
          url: campaign.url,
          title: campaign.title,
          target_clicks: campaign.target_clicks,
          sats_per_click: campaign.sats_per_click,
          total_budget_sats: campaign.total_budget_sats,
          duration_sec: campaign.duration_sec,
          target_audience: campaign.target_audience,
          invoice,
        })
        .select()
        .maybeSingle();
      if (error) {
        pushToast('error', 'Failed to create campaign.');
        return null;
      }
      pushToast('success', 'Campaign created! Pay the invoice to activate.');
      await fetchCampaigns();
      return data as Campaign;
    },
    [pushToast, fetchCampaigns]
  );

  const activateCampaign = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'active' })
        .eq('id', id);
      if (error) {
        pushToast('error', 'Failed to activate campaign.');
        return;
      }
      pushToast('success', 'Campaign activated!');
      await fetchCampaigns();
    },
    [pushToast, fetchCampaigns]
  );

  const fetchAdminData = useCallback(async () => {
    if (!profile?.is_admin) return;

    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (users) setAdminUsers(users as Profile[]);

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: views } = await supabase
      .from('ad_views')
      .select('reward_sats');
    const totalAdsServed = views?.length || 0;
    const totalRevenue = views?.reduce((sum, v) => sum + (v.reward_sats || 0), 0) || 0;

    const { data: paidWithdrawals } = await supabase
      .from('withdrawals')
      .select('amount_sats')
      .eq('status', 'paid');
    const totalPayouts = paidWithdrawals?.reduce((sum, w) => sum + (w.amount_sats || 0), 0) || 0;

    setAdminStats({
      totalRevenueSats: totalRevenue,
      totalPayoutsSats: totalPayouts,
      activeUsers: totalUsers || 0,
      pendingApprovals: pendingCount || 0,
      totalAdsServed,
    });

    await fetchAds();
  }, [profile?.is_admin, fetchAds]);

  const adminUpdateAd = useCallback(
    async (
      id: string,
      updates: {
        title: string;
        domain: string;
        description: string;
        duration_sec: number;
        reward_sats: number;
        clicks_target: number;
        category: string;
        image_url: string;
        status: string;
      }
    ): Promise<boolean> => {
      const { error } = await supabase
        .from('ads')
        .update({
          title: updates.title,
          domain: updates.domain,
          description: updates.description,
          duration_sec: updates.duration_sec,
          reward_sats: updates.reward_sats,
          clicks_target: updates.clicks_target,
          category: updates.category,
          image_url: updates.image_url,
          status: updates.status,
        })
        .eq('id', id);
      if (error) {
        pushToast('error', 'Failed to update ad.');
        return false;
      }
      pushToast('success', 'Ad updated!');
      await fetchAds();
      await fetchAdminData();
      return true;
    },
    [pushToast, fetchAds, fetchAdminData]
  );

  const adminDeleteAd = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from('ads').delete().eq('id', id);
      if (error) {
        pushToast('error', 'Failed to delete ad.');
        return false;
      }
      pushToast('info', 'Ad deleted.');
      await fetchAds();
      await fetchAdminData();
      return true;
    },
    [pushToast, fetchAds, fetchAdminData]
  );

  const adminCreateAd = useCallback(
    async (adData: {
      title: string;
      domain: string;
      description: string;
      duration_sec: number;
      reward_sats: number;
      clicks_target: number;
      category: string;
      image_url: string;
    }): Promise<boolean> => {
      const { error } = await supabase.rpc('admin_create_ad', {
        p_title: adData.title,
        p_domain: adData.domain,
        p_description: adData.description,
        p_duration_sec: adData.duration_sec,
        p_reward_sats: adData.reward_sats,
        p_clicks_target: adData.clicks_target,
        p_category: adData.category,
        p_image_url: adData.image_url,
      });
      if (error) {
        pushToast('error', 'Failed to create ad.');
        return false;
      }
      pushToast('success', 'Ad created and published!');
      await fetchAds();
      await fetchAdminData();
      return true;
    },
    [pushToast, fetchAds, fetchAdminData]
  );

  const approveAd = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc('admin_approve_ad', { p_ad_id: id });
      if (error) {
        pushToast('error', 'Failed to approve ad.');
        return;
      }
      pushToast('success', 'Ad approved and published!');
      await fetchAds();
      await fetchAdminData();
    },
    [pushToast, fetchAds, fetchAdminData]
  );

  const rejectAd = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc('admin_reject_ad', { p_ad_id: id });
      if (error) {
        pushToast('error', 'Failed to reject ad.');
        return;
      }
      pushToast('info', 'Ad rejected.');
      await fetchAds();
      await fetchAdminData();
    },
    [pushToast, fetchAds, fetchAdminData]
  );

  const toggleBanUser = useCallback(
    async (id: string) => {
      const { data, error } = await supabase.rpc('admin_toggle_user_status', { p_user_id: id });
      if (error) {
        pushToast('error', 'Failed to update user.');
        return;
      }
      const newStatus = data as string;
      pushToast(newStatus === 'banned' ? 'error' : 'success', `User ${newStatus === 'banned' ? 'banned' : 'unbanned'}`);
      await fetchAdminData();
    },
    [pushToast, fetchAdminData]
  );

  const updateCurrencyPreference = useCallback(
    async (currency: DisplayCurrency): Promise<boolean> => {
      if (!profile?.id) return false;
      const { error } = await supabase
        .from('profiles')
        .update({ display_currency: currency })
        .eq('id', profile.id);
      if (error) {
        pushToast('error', 'Failed to save currency preference.');
        return false;
      }
      await refreshProfile();
      pushToast('success', `Display currency set to ${currency.toUpperCase()}.`);
      return true;
    },
    [profile?.id, pushToast, refreshProfile]
  );

  const { price: btcPrice, loading: btcPriceLoading } = useBtcPrice();

  const displayCurrency: DisplayCurrency = (profile?.display_currency as DisplayCurrency) || 'sats';

  return {
    profile,
    ads,
    pendingAds,
    allAds,
    campaigns,
    withdrawals,
    adminUsers,
    adminStats,
    loadingAds,
    toasts,
    floatReward,
    pushToast,
    claimAd,
    requestWithdraw,
    createCampaign,
    activateCampaign,
    fetchAdminData,
    adminCreateAd,
    adminUpdateAd,
    adminDeleteAd,
    approveAd,
    rejectAd,
    toggleBanUser,
    updateCurrencyPreference,
    btcPrice,
    btcPriceLoading,
    displayCurrency,
    minWithdraw: MIN_WITHDRAW,
    referralBonus: REFERRAL_BONUS,
  };
}

export type Store = ReturnType<typeof useStore>;
