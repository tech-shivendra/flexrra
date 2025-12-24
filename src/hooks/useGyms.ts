import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

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
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  approvedByAdmin: boolean;
}

const API_URL = 'http://localhost:5000/api';

// Mock data for development
const mockGyms: Gym[] = [
  {
    _id: '1',
    name: 'FitLife Gym',
    address: '123 Fitness Street, Connaught Place',
    city: 'Delhi',
    pincode: '110001',
    openTime: '06:00',
    closeTime: '22:00',
    facilities: ['Weights', 'Cardio', 'CrossFit', 'Yoga'],
    amenities: ['Locker Room', 'Shower', 'Parking', 'AC'],
    phone: '9876543210',
    owner: { name: 'Rahul Sharma', email: 'rahul@fitlife.com', phone: '9876543210' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '2',
    name: 'Iron Paradise',
    address: '45 Muscle Lane, Karol Bagh',
    city: 'Delhi',
    pincode: '110005',
    openTime: '05:00',
    closeTime: '23:00',
    facilities: ['Weights', 'Powerlifting', 'Cardio'],
    amenities: ['Locker Room', 'Shower', 'Protein Bar'],
    phone: '9876543211',
    owner: { name: 'Amit Khanna', email: 'amit@ironparadise.com', phone: '9876543211' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '3',
    name: 'Zen Fitness Studio',
    address: '78 Peace Road, Bandra West',
    city: 'Mumbai',
    pincode: '400050',
    openTime: '06:00',
    closeTime: '21:00',
    facilities: ['Yoga', 'Pilates', 'Meditation', 'Cardio'],
    amenities: ['Locker Room', 'Shower', 'Cafe', 'AC'],
    phone: '9876543212',
    owner: { name: 'Priya Patel', email: 'priya@zenfitness.com', phone: '9876543212' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '4',
    name: 'PowerHouse Gym',
    address: '12 Strength Avenue, Andheri East',
    city: 'Mumbai',
    pincode: '400069',
    openTime: '05:30',
    closeTime: '22:30',
    facilities: ['Weights', 'Cardio', 'Boxing', 'CrossFit'],
    amenities: ['Locker Room', 'Shower', 'Parking', 'Sauna'],
    phone: '9876543213',
    owner: { name: 'Vikram Singh', email: 'vikram@powerhouse.com', phone: '9876543213' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '5',
    name: 'Elite Fitness Club',
    address: '56 Premium Lane, Koramangala',
    city: 'Bangalore',
    pincode: '560034',
    openTime: '05:00',
    closeTime: '23:00',
    facilities: ['Weights', 'Cardio', 'Swimming', 'Zumba'],
    amenities: ['Pool', 'Locker Room', 'Shower', 'Cafe', 'AC'],
    phone: '9876543214',
    owner: { name: 'Deepak Rao', email: 'deepak@elitefitness.com', phone: '9876543214' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '6',
    name: 'The Fitness Factory',
    address: '89 Workout Road, Indiranagar',
    city: 'Bangalore',
    pincode: '560038',
    openTime: '06:00',
    closeTime: '22:00',
    facilities: ['Weights', 'Cardio', 'HIIT', 'Yoga'],
    amenities: ['Locker Room', 'Shower', 'Parking', 'AC'],
    phone: '9876543215',
    owner: { name: 'Kavitha Nair', email: 'kavitha@fitnessfactory.com', phone: '9876543215' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '7',
    name: 'Muscle Mania',
    address: '34 Gym Street, Rajouri Garden',
    city: 'Delhi',
    pincode: '110027',
    openTime: '05:00',
    closeTime: '22:00',
    facilities: ['Weights', 'Powerlifting', 'Cardio', 'Functional'],
    amenities: ['Locker Room', 'Shower', 'Supplements Shop'],
    phone: '9876543216',
    owner: { name: 'Suresh Kumar', email: 'suresh@musclemania.com', phone: '9876543216' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '8',
    name: 'Urban Sweat',
    address: '67 Health Hub, Juhu',
    city: 'Mumbai',
    pincode: '400049',
    openTime: '06:00',
    closeTime: '21:00',
    facilities: ['Cardio', 'Yoga', 'Dance', 'Spinning'],
    amenities: ['Locker Room', 'Shower', 'Juice Bar', 'AC'],
    phone: '9876543217',
    owner: { name: 'Neha Desai', email: 'neha@urbansweat.com', phone: '9876543217' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '9',
    name: 'Flex Zone',
    address: '23 Athletic Avenue, HSR Layout',
    city: 'Bangalore',
    pincode: '560102',
    openTime: '05:30',
    closeTime: '23:00',
    facilities: ['Weights', 'Cardio', 'CrossFit', 'MMA'],
    amenities: ['Locker Room', 'Shower', 'Parking', 'Steam Room'],
    phone: '9876543218',
    owner: { name: 'Kiran Reddy', email: 'kiran@flexzone.com', phone: '9876543218' },
    status: 'active',
    approvedByAdmin: true,
  },
  {
    _id: '10',
    name: 'Transform Fitness',
    address: '45 Change Lane, Dwarka',
    city: 'Delhi',
    pincode: '110075',
    openTime: '06:00',
    closeTime: '22:00',
    facilities: ['Weights', 'Cardio', 'Personal Training', 'Nutrition'],
    amenities: ['Locker Room', 'Shower', 'AC', 'Cafe'],
    phone: '9876543219',
    owner: { name: 'Ankit Verma', email: 'ankit@transformfitness.com', phone: '9876543219' },
    status: 'active',
    approvedByAdmin: true,
  },
];

export const useGyms = () => {
  const { token } = useAuth();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGyms = useCallback(async (city?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = city ? `${API_URL}/gyms?city=${city}` : `${API_URL}/gyms`;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gyms');
      }
      
      const data = await response.json();
      setGyms(data);
    } catch (err) {
      // Fallback to mock data if API fails
      const filteredGyms = city 
        ? mockGyms.filter(gym => gym.city.toLowerCase() === city.toLowerCase())
        : mockGyms;
      setGyms(filteredGyms);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const getGymById = useCallback(async (id: string): Promise<Gym | null> => {
    try {
      const response = await fetch(`${API_URL}/gyms/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gym');
      }
      
      return await response.json();
    } catch (err) {
      // Fallback to mock data
      return mockGyms.find(gym => gym._id === id) || null;
    }
  }, [token]);

  return { gyms, isLoading, error, fetchGyms, getGymById };
};
