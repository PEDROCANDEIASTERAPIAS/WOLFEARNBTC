import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  username: string;
  avatar_hue: number;
  sats_balance: number;
  total_earned_sats: number;
  ads_clicked: number;
  referral_earnings_sats: number;
  referral_code: string;
  is_admin: boolean;
  status: string;
  created_at: string;
  display_currency: string;
  last_withdrawal_at: string | null;
  membership_tier: string;
};

export type Ad = {
  id: string;
  title: string;
  domain: string;
  description: string;
  duration_sec: number;
  reward_sats: number;
  clicks_remaining: number;
  clicks_target: number;
  category: string;
  image_url: string;
  advertiser_id: string | null;
  status: string;
  created_at: string;
};

export type Campaign = {
  id: string;
  advertiser_name: string;
  url: string;
  title: string;
  target_clicks: number;
  sats_per_click: number;
  total_budget_sats: number;
  status: string;
  clicks_delivered: number;
  invoice: string;
  user_id: string;
  created_at: string;
  duration_sec: number;
  target_audience: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  destination: string;
  amount_sats: number;
  status: string;
  created_at: string;
};

export type AdminUser = {
  id: string;
  username: string;
  sats_balance: number;
  total_earned_sats: number;
  status: string;
  created_at: string;
};

export type AdminStats = {
  totalRevenueSats: number;
  totalPayoutsSats: number;
  activeUsers: number;
  pendingApprovals: number;
  totalAdsServed: number;
};

export type UserProfile = {
  id: string;
  username: string;
  sats_balance: number;
  total_earned_sats: number;
  status: string;
  created_at: string;
  is_admin: boolean;
  is_banned: boolean;
};

export type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount_sats: number;
  invoice_or_address: string;
  status: string;
  created_at: string;
};
