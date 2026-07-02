import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  plan: string;
  pause_count: number;
  resumed_at: string | null;
}

export const useSubscription = () => {
  const { user, session, updateSubscription, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  // Fetch current subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      // Auto-expire any subscription past its end_date before reading state.
      await supabase.rpc('expire_my_subscription' as never);
      await refreshProfile();

      const { data } = await supabase
        .from('subscriptions')
        .select('plan, pause_count, resumed_at')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setSubscriptionData(data);
      }
    };
    
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const getMaxPauses = (plan: string) => {
    return plan === 'annual' ? 3 : 1;
  };

  const getRemainingPauses = () => {
    if (!subscriptionData) return 0;
    const maxPauses = getMaxPauses(subscriptionData.plan);
    return Math.max(0, maxPauses - subscriptionData.pause_count);
  };

  const getDaysSinceLastResume = () => {
    if (!subscriptionData?.resumed_at) return null;
    const resumedDate = new Date(subscriptionData.resumed_at);
    const now = new Date();
    const diffTime = now.getTime() - resumedDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const canPause = () => {
    if (!subscriptionData) return false;
    if (getRemainingPauses() <= 0) return false;
    
    // Check 10-day gap requirement (only if they've resumed before)
    const daysSinceResume = getDaysSinceLastResume();
    if (daysSinceResume !== null && daysSinceResume < 10) return false;
    
    return true;
  };

  const getDaysUntilCanPause = () => {
    const daysSinceResume = getDaysSinceLastResume();
    if (daysSinceResume === null) return 0;
    return Math.max(0, 10 - daysSinceResume);
  };

  const createSubscription = async (
    razorpayOrderId?: string, 
    razorpayPaymentId?: string,
    planType: 'monthly' | 'annual' = 'monthly',
    price?: number,
    couponInfo?: { code: string; discount: number; originalPrice: number }
  ) => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const body: Record<string, unknown> = {
        razorpay_order_id: razorpayOrderId || null,
        razorpay_payment_id: razorpayPaymentId || null,
        plan_type: planType,
        price: price ?? (planType === 'annual' ? 14999 : 1499),
      };

      if (couponInfo) {
        body.coupon_code = couponInfo.code;
        body.original_price = couponInfo.originalPrice;
        body.discount_percent = couponInfo.discount;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-subscription', {
        body,
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to create subscription');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Update profile subscription status locally
      await updateSubscription('active', data.end_date);
      
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSubscription = async () => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    // Client-side check for better UX (server enforces the real check)
    if (!canPause()) {
      const maxPauses = subscriptionData?.plan === 'annual' ? 3 : 1;
      return { 
        success: false, 
        error: `You've reached the maximum ${maxPauses} pause${maxPauses > 1 ? 's' : ''} for your ${subscriptionData?.plan} plan`
      };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use secure RPC function for pause operation
      const { data, error: rpcError } = await supabase.rpc('pause_subscription');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const result = data as { success: boolean; error?: string; pause_count?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to pause subscription');
      }

      // Update local state
      setSubscriptionData(prev => prev ? { ...prev, pause_count: result.pause_count || prev.pause_count + 1 } : null);
      await refreshProfile();
      
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSubscription = async () => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use secure RPC function for resume operation
      const { data, error: rpcError } = await supabase.rpc('resume_subscription');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const result = data as { success: boolean; error?: string; end_date?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to resume subscription');
      }

      await refreshProfile();
      
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscriptionStatus: user?.subscription_status || 'inactive',
    subscriptionEndDate: user?.subscription_end_date,
    subscriptionPlan: subscriptionData?.plan,
    pauseCount: subscriptionData?.pause_count || 0,
    remainingPauses: getRemainingPauses(),
    canPause: canPause(),
    daysUntilCanPause: getDaysUntilCanPause(),
    isLoading,
    error,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
  };
};
