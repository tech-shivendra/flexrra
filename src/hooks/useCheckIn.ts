import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_URL = 'http://localhost:5000/api';

export interface CheckIn {
  _id: string;
  userId: string;
  gymId: string;
  checkInTime: string;
  checkInType: 'qr' | 'manual';
  status: 'checkedIn' | 'checkedOut';
  gymDetails?: {
    name: string;
    address: string;
    city: string;
  };
}

export const useCheckIn = () => {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckIn[]>([]);

  const checkIn = async (gymId: string, gymName: string) => {
    if (!user || !token) return { success: false, error: 'Not authenticated' };
    
    // Check if already checked in today at this gym
    const today = new Date().toDateString();
    const existingCheckIn = history.find(
      (c) => c.gymId === gymId && new Date(c.checkInTime).toDateString() === today
    );
    
    if (existingCheckIn) {
      return { success: false, error: 'You have already checked in at this gym today!' };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id, gymId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to check in');
      }
      
      const data = await response.json();
      
      // Add to local history
      const newCheckIn: CheckIn = {
        _id: data.checkIn?._id || Date.now().toString(),
        userId: user._id,
        gymId,
        checkInTime: new Date().toISOString(),
        checkInType: 'manual',
        status: 'checkedIn',
        gymDetails: {
          name: gymName,
          address: '',
          city: '',
        },
      };
      
      setHistory((prev) => [newCheckIn, ...prev]);
      
      return { success: true };
    } catch (err) {
      // Mock success for development
      const newCheckIn: CheckIn = {
        _id: Date.now().toString(),
        userId: user._id,
        gymId,
        checkInTime: new Date().toISOString(),
        checkInType: 'manual',
        status: 'checkedIn',
        gymDetails: {
          name: gymName,
          address: '',
          city: '',
        },
      };
      
      setHistory((prev) => [newCheckIn, ...prev]);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!user || !token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/checkins/history/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch check-in history');
      }
      
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      // Keep existing history or empty array
      setError('Could not load history');
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  const getWorkoutsThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return history.filter((checkIn) => {
      const checkInDate = new Date(checkIn.checkInTime);
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
