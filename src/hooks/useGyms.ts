import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Fallback gym images from Unsplash (used when no images are uploaded)
const fallbackImages = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=300&fit=crop',
];

// Gallery fallback images
const fallbackGalleryImages = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
];

// Helper to get fallback gallery
const getFallbackGallery = (index: number): string[] => {
  const startIdx = index % fallbackGalleryImages.length;
  return [
    fallbackGalleryImages[startIdx % fallbackGalleryImages.length],
    fallbackGalleryImages[(startIdx + 1) % fallbackGalleryImages.length],
    fallbackGalleryImages[(startIdx + 2) % fallbackGalleryImages.length],
    fallbackGalleryImages[(startIdx + 3) % fallbackGalleryImages.length],
  ];
};

// Helper to get a fallback image
const getFallbackImage = (id: string, index: number): string => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbackImages[(hash + index) % fallbackImages.length];
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
}

interface DbGymImage {
  id: string;
  gym_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

// Transform database gym to frontend gym format
const transformGym = (
  dbGym: DbGym, 
  index: number, 
  images: DbGymImage[]
): Gym => {
  const gymImages = images.filter(img => img.gym_id === dbGym.id);
  const primaryImage = gymImages.find(img => img.is_primary);
  const mainImage = primaryImage?.image_url || gymImages[0]?.image_url || getFallbackImage(dbGym.id, index);
  const gallery = gymImages.length > 0 
    ? gymImages.map(img => img.image_url) 
    : getFallbackGallery(index);

  return {
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
    image: mainImage,
    gallery,
    status: dbGym.status as 'active' | 'inactive',
  };
};

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
        .select('id, name, address, city, pincode, open_time, close_time, facilities, amenities, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data: gymsData, error: gymsError } = await query;

      if (gymsError) throw gymsError;

      // Fetch all gym images
      const gymIds = (gymsData || []).map(g => g.id);
      let imagesData: DbGymImage[] = [];
      
      if (gymIds.length > 0) {
        const { data: images, error: imagesError } = await supabase
          .from('gym_images')
          .select('*')
          .in('gym_id', gymIds);

        if (!imagesError && images) {
          imagesData = images;
        }
      }

      const transformedGyms = (gymsData || []).map((gym, index) => 
        transformGym(gym as DbGym, index, imagesData)
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
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('id, name, address, city, pincode, open_time, close_time, facilities, amenities, status, created_at')
        .eq('id', id)
        .maybeSingle();

      if (gymError) throw gymError;
      if (!gymData) return null;

      // Fetch images for this gym
      const { data: images } = await supabase
        .from('gym_images')
        .select('*')
        .eq('gym_id', id)
        .order('is_primary', { ascending: false });

      return transformGym(gymData as DbGym, 0, images || []);
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
