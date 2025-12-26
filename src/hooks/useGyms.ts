import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Gym images from Unsplash for display (since DB doesn't store images)
const gymImages = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
];

// Gallery images for gyms
const galleryImages = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=400&fit=crop',
];

// Helper to get gallery images for each gym
const getGymGallery = (index: number): string[] => {
  const startIdx = index % galleryImages.length;
  return [
    galleryImages[startIdx % galleryImages.length],
    galleryImages[(startIdx + 1) % galleryImages.length],
    galleryImages[(startIdx + 2) % galleryImages.length],
    galleryImages[(startIdx + 3) % galleryImages.length],
  ];
};

// Helper to get a consistent image for a gym based on its id
const getGymImage = (id: string, index: number): string => {
  // Use a hash of the id to get a consistent image
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gymImages[(hash + index) % gymImages.length];
};

export interface Gym {
  _id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  openTime: string;
  closeTime: string;
  facilities: string[];
  amenities: string[];
  phone: string;
  image: string;
  gallery: string[];
  status: 'active' | 'inactive';
  qr_code: string;
}

interface DbGym {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string | null;
  open_time: string;
  close_time: string;
  facilities: string[] | null;
  amenities: string[] | null;
  phone: string | null;
  status: string;
  qr_code: string;
}

// Transform database gym to frontend gym format
const transformGym = (dbGym: DbGym, index: number): Gym => ({
  _id: dbGym.id,
  name: dbGym.name,
  address: dbGym.address,
  city: dbGym.city,
  pincode: dbGym.pincode || '',
  openTime: dbGym.open_time,
  closeTime: dbGym.close_time,
  facilities: dbGym.facilities || [],
  amenities: dbGym.amenities || [],
  phone: dbGym.phone || '',
  image: getGymImage(dbGym.id, index),
  gallery: getGymGallery(index),
  status: dbGym.status as 'active' | 'inactive',
  qr_code: dbGym.qr_code,
});

export const useGyms = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGyms = useCallback(async (city?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('gyms')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedGyms = (data || []).map((gym, index) => 
        transformGym(gym as DbGym, index)
      );
      
      setGyms(transformedGyms);
    } catch (err: any) {
      console.error('Error fetching gyms:', err);
      setError(err.message || 'Failed to fetch gyms');
      setGyms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGymById = useCallback(async (id: string): Promise<Gym | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) return null;

      return transformGym(data as DbGym, 0);
    } catch (err: any) {
      console.error('Error fetching gym:', err);
      return null;
    }
  }, []);

  // Get unique cities from the gyms for filtering
  const getCities = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('gyms')
        .select('city')
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      const uniqueCities = [...new Set((data || []).map(g => g.city))];
      return uniqueCities.sort();
    } catch (err: any) {
      console.error('Error fetching cities:', err);
      return [];
    }
  }, []);

  return {
    gyms,
    isLoading,
    error,
    fetchGyms,
    getGymById,
    getCities,
  };
};
