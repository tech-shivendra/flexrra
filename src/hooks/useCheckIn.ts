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
      // Fetch subscription status
      const sub = await fetchSubscription();
      
      if (!sub) {
        return { success: false, error: 'No active subscription found. Please purchase a plan.' };
      }

      if (sub.remaining_sessions <= 0) {
        return { success: false, error: 'No sessions remaining. Please renew your subscription.' };
      }

      // Find gym by QR code
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('qr_code', qrCode)
        .maybeSingle();

      if (gymError || !gym) {
        return { success: false, error: 'Invalid QR code. Gym not found.' };
      }

      // Check if already checked in today at this gym
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('gym_id', gym.id)
        .gte('check_in_time', today.toISOString())
        .maybeSingle();

      if (existingCheckIn) {
        return { success: false, error: 'You have already checked in at this gym today!' };
      }

      // Create check-in record
      const { data: checkInData, error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          gym_id: gym.id,
          gym_name: gym.name,
          gym_address: gym.address,
          gym_city: gym.city,
          check_in_type: 'qr',
          status: 'checkedIn',
          session_deducted: true,
        })
        .select()
        .single();

      if (checkInError) {
        throw new Error(checkInError.message);
      }

      // Deduct session using secure RPC function
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_session', { p_subscription_id: sub.id });

      if (deductError) {
        console.error('Error deducting session:', deductError);
        // Don't fail the check-in, but log the error
      } else if (deductResult && typeof deductResult === 'object' && 'success' in deductResult && !deductResult.success) {
        console.error('Session deduction failed:', (deductResult as { error?: string }).error);
      }

      // Update local state
      setHistory((prev) => [checkInData as CheckIn, ...prev]);
      setSubscription((prev) => prev ? { ...prev, remaining_sessions: prev.remaining_sessions - 1 } : null);

      return { 
        success: true, 
        gym,
        remainingSessions: sub.remaining_sessions - 1 
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
    
    // Check if already checked in today at this gym
    const today = new Date().toDateString();
    const existingCheckIn = history.find(
      (c) => c.gym_id === gymId && new Date(c.check_in_time).toDateString() === today
    );
    
    if (existingCheckIn) {
      return { success: false, error: 'You have already checked in at this gym today!' };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: insertError } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          gym_id: gymId,
          gym_name: gymName,
          gym_address: gymAddress || null,
          gym_city: gymCity || null,
          check_in_type: 'manual',
          status: 'checkedIn',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Add to local history
      setHistory((prev) => [data as CheckIn, ...prev]);
      
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
