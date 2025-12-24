import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Pause,
  Play,
  LogOut,
  Loader2,
  Edit,
  Check,
} from 'lucide-react';
import { useState } from 'react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    subscriptionStatus,
    subscriptionEndDate,
    isLoading,
    pauseSubscription,
    resumeSubscription,
  } = useSubscription();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handlePause = async () => {
    setActionLoading('pause');
    const result = await pauseSubscription();
    setActionLoading(null);
    
    if (result.success) {
      toast.success('Subscription paused');
    } else {
      toast.error(result.error || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    setActionLoading('resume');
    const result = await resumeSubscription();
    setActionLoading(null);
    
    if (result.success) {
      toast.success('Subscription resumed!');
    } else {
      toast.error(result.error || 'Failed to resume');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = () => {
    switch (subscriptionStatus) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'paused':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-destructive/10 text-destructive';
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          {/* Profile Header */}
          <div className="mb-6 rounded-2xl gradient-primary p-8 text-center animate-fade-in">
            <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm text-4xl font-bold text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="mb-1 text-2xl font-bold text-primary-foreground">{user.name}</h1>
            <p className="text-primary-foreground/80">{user.email}</p>
          </div>

          {/* Subscription Card */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Subscription</h3>
                  <p className="text-sm text-muted-foreground">Monthly Pass</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor()}`}>
                {subscriptionStatus === 'active'
                  ? 'Active'
                  : subscriptionStatus === 'paused'
                  ? 'Paused'
                  : 'Inactive'}
              </span>
            </div>

            {subscriptionStatus !== 'inactive' && (
              <>
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {subscriptionStatus === 'active' ? 'Expires' : 'Paused until'}: {formatDate(subscriptionEndDate)}
                </div>

                <div className="flex gap-3">
                  {subscriptionStatus === 'active' ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handlePause}
                      disabled={isLoading || actionLoading !== null}
                    >
                      {actionLoading === 'pause' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Pause className="mr-2 h-4 w-4" />
                      )}
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={handleResume}
                      disabled={isLoading || actionLoading !== null}
                    >
                      {actionLoading === 'resume' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Resume
                    </Button>
                  )}
                </div>
              </>
            )}

            {subscriptionStatus === 'inactive' && (
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => navigate('/plans')}
              >
                Get Subscription
              </Button>
            )}
          </div>

          {/* User Details */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Personal Information</h3>
              <Button variant="ghost" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <User className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium text-foreground">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Mail className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Phone className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{user.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <MapPin className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Home Area</p>
                  <p className="font-medium text-foreground">{user.homeArea}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-lg">
                    🎂
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-medium text-foreground">{user.age} years</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-lg">
                    {user.gender === 'male' ? '👨' : user.gender === 'female' ? '👩' : '🧑'}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="font-medium text-foreground capitalize">{user.gender}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
