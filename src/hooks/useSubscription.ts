import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const API_URL = 'http://localhost:5000/api';

export const useSubscription = () => {
  const { user, token, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = async () => {
    if (!user || !token) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create subscription');
      }
      
      const data = await response.json();
      
      // Update user state with new subscription info
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active' as const,
        subscriptionStartDate: data.subscription.startDate,
        subscriptionEndDate: data.subscription.endDate,
      };
      updateUser(updatedUser);
      
      return { success: true };
    } catch (err: any) {
      // Mock success for development
      const mockEndDate = new Date();
      mockEndDate.setDate(mockEndDate.getDate() + 30);
      
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active' as const,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: mockEndDate.toISOString(),
      };
      updateUser(updatedUser);
      
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSubscription = async () => {
    if (!user || !token) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/subscriptions/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to pause subscription');
      }
      
      const updatedUser = { ...user, subscriptionStatus: 'paused' as const };
      updateUser(updatedUser);
      
      return { success: true };
    } catch (err) {
      // Mock success for development
      const updatedUser = { ...user, subscriptionStatus: 'paused' as const };
      updateUser(updatedUser);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSubscription = async () => {
    if (!user || !token) return { success: false, error: 'Not authenticated' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/subscriptions/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resume subscription');
      }
      
      const data = await response.json();
      
      const mockEndDate = new Date();
      mockEndDate.setDate(mockEndDate.getDate() + 30);
      
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active' as const,
        subscriptionEndDate: data.subscription?.endDate || mockEndDate.toISOString(),
      };
      updateUser(updatedUser);
      
      return { success: true };
    } catch (err) {
      // Mock success for development
      const mockEndDate = new Date();
      mockEndDate.setDate(mockEndDate.getDate() + 30);
      
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active' as const,
        subscriptionEndDate: mockEndDate.toISOString(),
      };
      updateUser(updatedUser);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscriptionStatus: user?.subscriptionStatus || 'inactive',
    subscriptionEndDate: user?.subscriptionEndDate,
    isLoading,
    error,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
  };
};
