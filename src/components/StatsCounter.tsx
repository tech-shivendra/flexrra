import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useCountUp } from '@/hooks/useCountUp';

interface StatItemProps {
  end: number;
  suffix?: string;
  label: string;
  delay?: number;
  isVisible: boolean;
}

const StatItem = ({ end, suffix = '', label, delay = 0, isVisible }: StatItemProps) => {
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
      <div className="text-4xl font-bold text-foreground md:text-5xl">
        {count}{suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

interface StatsCounterProps {
  stats: {
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