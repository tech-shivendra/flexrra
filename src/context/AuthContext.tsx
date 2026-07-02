import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  home_area: string | null;
  subscription_status: 'active' | 'paused' | 'inactive';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateSubscription: (status: 'active' | 'paused' | 'inactive', endDate?: string) => Promise<void>;
}

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  age: number;
  gender: string;
  homeArea: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    // Auto-expire the user's subscription if past end_date so the profile
    // status returned below reflects reality.
    try {
      await supabase.rpc('expire_my_subscription' as never);
    } catch (err) {
      console.warn('expire_my_subscription failed:', err);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile | null;
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) {
      setUser(profile);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(async () => {
            const profile = await fetchProfile(currentSession.user.id);
            setUser(profile);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        const profile = await fetchProfile(existingSession.user.id);
        setUser(profile);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (signupData: SignupData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: signupData.name,
            phone: signupData.phone,
            age: signupData.age,
            gender: signupData.gender,
            home_area: signupData.homeArea,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases
        if (error.message.includes('already registered')) {
          return { success: false, error: 'This email is already registered. Please login instead.' };
        }
        
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateSubscription = async (
    status: 'active' | 'paused' | 'inactive',
    endDate?: string
  ) => {
    if (!session?.user?.id) return;

    const updates: any = {
      subscription_status: status,
      updated_at: new Date().toISOString(),
    };

    if (endDate) {
      updates.subscription_end_date = endDate;
    }

    if (status === 'active' && !user?.subscription_start_date) {
      updates.subscription_start_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating subscription:', error);
      return;
    }

    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
        updateSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
