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
  }, [user]);

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
      const endDate = new Date();
      const daysToAdd = planType === 'annual' ? 365 : 30;
      endDate.setDate(endDate.getDate() + daysToAdd);
      
      const subscriptionPrice = price ?? (planType === 'annual' ? 14999 : 1499);
      
      // Insert subscription record with coupon info if provided
      const subscriptionData: any = {
        user_id: user.id,
        plan: planType,
        price: subscriptionPrice,
        status: 'active',
        end_date: endDate.toISOString(),
        razorpay_order_id: razorpayOrderId || null,
        razorpay_payment_id: razorpayPaymentId || null,
      };

      // Add coupon info if coupon was applied
      if (couponInfo) {
        subscriptionData.coupon_code = couponInfo.code;
        subscriptionData.original_price = couponInfo.originalPrice;
        subscriptionData.discount_percent = couponInfo.discount;
      }

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update profile subscription status
      await updateSubscription('active', endDate.toISOString());
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSubscription = async () => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    // Check if pause limit is reached
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
      // Update the latest active subscription with incremented pause_count
      const newPauseCount = (subscriptionData?.pause_count || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
          pause_count: newPauseCount,
        })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setSubscriptionData(prev => prev ? { ...prev, pause_count: newPauseCount } : null);
      await updateSubscription('paused');
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSubscription = async () => {
    if (!user || !session) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      // Update the latest paused subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          resumed_at: new Date().toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'paused')
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await updateSubscription('active', endDate.toISOString());
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
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
