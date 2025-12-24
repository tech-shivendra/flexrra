import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGyms, Gym } from '@/hooks/useGyms';
import { useAuth } from '@/context/AuthContext';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Loader2,
  Check,
  Dumbbell,
  Sparkles,
} from 'lucide-react';

const facilityIcons: { [key: string]: string } = {
  Weights: '🏋️',
  Cardio: '🏃',
  Yoga: '🧘',
  CrossFit: '💪',
  Swimming: '🏊',
  Boxing: '🥊',
  Pilates: '🤸',
  Zumba: '💃',
  HIIT: '⚡',
  Spinning: '🚴',
  Powerlifting: '🏋️‍♂️',
  MMA: '🥋',
  Dance: '💃',
  Meditation: '🧘‍♀️',
  Functional: '🔥',
  'Personal Training': '👨‍🏫',
  Nutrition: '🥗',
};

const amenityIcons: { [key: string]: string } = {
  'Locker Room': '🔐',
  Shower: '🚿',
  Parking: '🅿️',
  AC: '❄️',
  Cafe: '☕',
  Pool: '🏊',
  Sauna: '🧖',
  'Protein Bar': '🥤',
  'Supplements Shop': '💊',
  'Juice Bar': '🧃',
  'Steam Room': '💨',
};

const GymDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getGymById } = useGyms();
  const { checkIn, isLoading: isCheckingIn, getLastCheckIn, history } = useCheckIn();
  
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGym = async () => {
      if (!id) return;
      setIsLoading(true);
      const gymData = await getGymById(id);
      setGym(gymData);
      setIsLoading(false);
    };
    loadGym();
  }, [id, getGymById]);

  const hasActiveSubscription = user?.subscriptionStatus === 'active';
  
  const hasCheckedInToday = () => {
    if (!id) return false;
    const today = new Date().toDateString();
    return history.some(
      (c) => c.gymId === id && new Date(c.checkInTime).toDateString() === today
    );
  };

  const handleCheckIn = async () => {
    if (!gym) return;
    
    const result = await checkIn(gym._id, gym.name);
    if (result.success) {
      toast.success('Check-in successful! Enjoy your workout! 💪');
    } else {
      toast.error(result.error || 'Check-in failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="text-5xl mb-4">🏋️</div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">Gym not found</h2>
        <p className="mb-4 text-muted-foreground">The gym you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Go Back Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-hero pb-12 pt-6">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              {/* Gym Icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                🏋️
              </div>
              <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
                {gym.name}
              </h1>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{gym.address}, {gym.city} - {gym.pincode}</span>
              </div>
            </div>

            {/* Check-in Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg lg:min-w-[300px]">
              {hasActiveSubscription ? (
                <>
                  {hasCheckedInToday() ? (
                    <div className="text-center">
                      <div className="mb-3 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-success/10">
                        <Check className="h-8 w-8 text-success" />
                      </div>
                      <h3 className="mb-1 font-semibold text-foreground">Checked In!</h3>
                      <p className="text-sm text-muted-foreground">
                        You've already checked in today. Enjoy your workout!
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="mb-4 text-center font-semibold text-foreground">
                        Ready to workout?
                      </h3>
                      <Button
                        variant="gradient"
                        size="xl"
                        className="w-full"
                        onClick={handleCheckIn}
                        disabled={isCheckingIn}
                      >
                        {isCheckingIn ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Checking in...
                          </>
                        ) : (
                          <>
                            <Dumbbell className="mr-2 h-5 w-5" />
                            Check In Now
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="mb-3 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-accent">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">Get Access</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Subscribe to check in at this gym
                  </p>
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate('/plans')}
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timings */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Opening Hours
              </h3>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent px-4 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Opens</p>
                  <p className="text-lg font-semibold text-foreground">{gym.openTime}</p>
                </div>
                <div className="h-px flex-1 bg-border" />
                <div className="rounded-lg bg-accent px-4 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Closes</p>
                  <p className="text-lg font-semibold text-foreground">{gym.closeTime}</p>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Facilities</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gym.facilities.map((facility) => (
                  <div
                    key={facility}
                    className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2"
                  >
                    <span className="text-lg">{facilityIcons[facility] || '✨'}</span>
                    <span className="text-sm font-medium text-foreground">{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Amenities</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gym.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2"
                  >
                    <span className="text-lg">{amenityIcons[amenity] || '✨'}</span>
                    <span className="text-sm font-medium text-foreground">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Contact</h3>
              <a
                href={`tel:${gym.phone}`}
                className="flex items-center gap-3 rounded-lg bg-accent px-4 py-3 transition-colors hover:bg-accent/80"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{gym.phone}</span>
              </a>
            </div>

            {/* Gallery Placeholder */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Gallery</h3>
              <div className="grid grid-cols-2 gap-2">
                {['🏋️', '💪', '🏃', '🧘'].map((emoji, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-lg bg-muted text-3xl"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymDetail;
