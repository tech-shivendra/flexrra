import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface CheckIn {
  id: string;
  user_id: string;
  gym_id: string;
  gym_name: string | null;
  gym_address: string | null;
  gym_city: string | null;
  check_in_time: string;
  check_in_type: 'qr' | 'manual';
  status: 'checkedIn' | 'checkedOut';
  session_deducted?: boolean;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  remaining_sessions: number;
  total_sessions: number;
  end_date: string;
}

export const useCheckIn = () => {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user || !session) return null;

    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, status, remaining_sessions, total_sessions, end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      return null;
    }

    setSubscription(data);
    return data;
  }, [user, session]);

  const qrCheckIn = async (qrCode: string) => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    setError(null);

    try {
      // Server-side validation: subscription, gym, duplicate check, session deduction
      const { data, error: rpcError } = await (supabase as any)
        .rpc('qr_check_in', { p_qr_code: qrCode });

      if (rpcError) throw new Error(rpcError.message);
      const result = data as { success: boolean; error?: string; gym?: any; remaining_sessions?: number };
      if (!result?.success) {
        return { success: false, error: result?.error || 'Check-in failed' };
      }

      setSubscription((prev) => prev ? { ...prev, remaining_sessions: result.remaining_sessions! } : prev);
      await fetchHistory();

      return {
        success: true,
        gym: result.gym,
        remainingSessions: result.remaining_sessions,
      };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const checkIn = async (gymId: string, gymName: string, gymAddress?: string, gymCity?: string) => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await (supabase as any)
        .rpc('manual_check_in', { p_gym_id: gymId });

      if (rpcError) throw new Error(rpcError.message);
      const result = data as { success: boolean; error?: string; remaining_sessions?: number };
      if (!result?.success) {
        return { success: false, error: result?.error || 'Check-in failed' };
      }

      setSubscription((prev) => prev ? { ...prev, remaining_sessions: result.remaining_sessions! } : prev);
      await fetchHistory();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!user || !session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('check_in_time', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setHistory(data as CheckIn[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  const getWorkoutsThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return history.filter((checkIn) => {
      const checkInDate = new Date(checkIn.check_in_time);
      return (
        checkInDate.getMonth() === currentMonth &&
        checkInDate.getFullYear() === currentYear
      );
    }).length;
  };

  const getLastCheckIn = () => {
    if (history.length === 0) return null;
    return history[0];
  };

  return {
    history,
    isLoading,
    error,
    subscription,
    checkIn,
    qrCheckIn,
    fetchHistory,
    fetchSubscription,
    getWorkoutsThisMonth,
    getLastCheckIn,
  };
};
