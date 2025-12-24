import { Link } from 'react-router-dom';
import { Gym } from '@/hooks/useGyms';
import { MapPin, Clock, Dumbbell } from 'lucide-react';

interface GymCardProps {
  gym: Gym;
}

const GymCard = ({ gym }: GymCardProps) => {
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

  return (
    <Link to={`/gym/${gym._id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30">
        {/* Gym Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-2xl">
          🏋️
        </div>

        {/* Gym Name */}
        <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {gym.name}
        </h3>

        {/* Address */}
        <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="line-clamp-2">{gym.address}</span>
        </div>

        {/* Timings */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-secondary" />
          <span>
            {gym.openTime} - {gym.closeTime}
          </span>
        </div>

        {/* Facilities Tags */}
        <div className="flex flex-wrap gap-2">
          {gym.facilities.slice(0, 4).map((facility) => (
            <span
              key={facility}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
            >
              <span>{facilityIcons[facility] || '✨'}</span>
              {facility}
            </span>
          ))}
          {gym.facilities.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              +{gym.facilities.length - 4} more
            </span>
          )}
        </div>

        {/* Hover Indicator */}
        <div className="absolute bottom-0 left-0 h-1 w-0 gradient-primary transition-all duration-300 group-hover:w-full" />
      </div>
    </Link>
  );
};

export default GymCard;
