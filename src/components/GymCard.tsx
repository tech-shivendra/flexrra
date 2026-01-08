import { Link } from 'react-router-dom';
import { Gym } from '@/hooks/useGyms';

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
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30">
        {/* Gym Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={gym.image}
            alt={gym.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-foreground drop-shadow-md line-clamp-1">
              {gym.name}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Address */}
          <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
            <span className="shrink-0">📍</span>
            <span className="line-clamp-1">{gym.address}</span>
          </div>

          {/* Timings */}
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>🕐</span>
            <span>
              {gym.openTime} - {gym.closeTime}
            </span>
          </div>

          {/* Facilities Tags */}
          <div className="flex flex-wrap gap-1.5">
            {gym.facilities.slice(0, 3).map((facility) => (
              <span
                key={facility}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
              >
                <span className="text-[10px]">{facilityIcons[facility] || '✨'}</span>
                {facility}
              </span>
            ))}
            {gym.facilities.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                +{gym.facilities.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Hover Indicator */}
        <div className="absolute bottom-0 left-0 h-1 w-0 gradient-primary transition-all duration-300 group-hover:w-full" />
      </div>
    </Link>
  );
};

export default GymCard;