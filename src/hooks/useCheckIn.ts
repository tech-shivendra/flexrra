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
}

export const useCheckIn = () => {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckIn[]>([]);

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
    checkIn,
    fetchHistory,
    getWorkoutsThisMonth,
    getLastCheckIn,
  };
};
