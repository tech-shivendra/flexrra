import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Loader2 } from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const { history, isLoading, fetchHistory, getWorkoutsThisMonth } = useCheckIn();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const workoutsThisMonth = getWorkoutsThisMonth();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Workout <span className="text-gradient">History</span>
          </h1>
          <p className="text-muted-foreground">Track your fitness journey</p>
        </div>

        <div className="mx-auto max-w-2xl">
          {/* Stats Card */}
          <div className="mb-6 rounded-2xl gradient-primary p-6 text-primary-foreground animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-primary-foreground/80">This Month</p>
                <p className="text-4xl font-bold">{workoutsThisMonth}</p>
                <p className="text-sm text-primary-foreground/80">workouts completed</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20 text-3xl">
                📈
              </div>
            </div>
          </div>

          {/* History List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center animate-fade-in">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent text-4xl">
                🏋️
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">No workouts yet</h3>
              <p className="text-muted-foreground">
                Start checking in at gyms to see your workout history here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((checkIn, index) => (
                <div
                  key={checkIn.id}
                  className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                        🏋️
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {checkIn.gym_name || 'Gym Workout'}
                        </h4>
                        {checkIn.gym_address && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            📍 {checkIn.gym_address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(checkIn.check_in_time)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatTime(checkIn.check_in_time)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;