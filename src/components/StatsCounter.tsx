import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useCountUp } from '@/hooks/useCountUp';
import { LucideIcon } from 'lucide-react';

interface StatItemProps {
  icon: LucideIcon;
  end: number;
  suffix?: string;
  label: string;
  delay?: number;
  isVisible: boolean;
}

const StatItem = ({ icon: Icon, end, suffix = '', label, delay = 0, isVisible }: StatItemProps) => {
  const count = useCountUp({ end, duration: 2000, enabled: isVisible });

  return (
    <div 
      className="flex flex-col items-center text-center opacity-0 translate-y-4 transition-all duration-700"
      style={{ 
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)'
      }}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-3xl font-bold text-foreground md:text-4xl">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

interface StatsCounterProps {
  stats: {
    icon: LucideIcon;
    end: number;
    suffix?: string;
    label: string;
  }[];
}

const StatsCounter = ({ stats }: StatsCounterProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <div 
      ref={ref}
      className="grid grid-cols-2 gap-8 md:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <StatItem
          key={stat.label}
          icon={stat.icon}
          end={stat.end}
          suffix={stat.suffix}
          label={stat.label}
          delay={index * 150}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
};

export default StatsCounter;
