import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Check,
  Zap,
  Shield,
  Clock,
  Loader2,
  Pause,
  Play,
  CreditCard,
  Sparkles,
} from 'lucide-react';

const Plans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    subscriptionStatus,
    subscriptionEndDate,
    isLoading,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
  } = useSubscription();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setActionLoading('subscribe');
    const result = await createSubscription();
    setActionLoading(null);
    
    if (result.success) {
      toast.success('Subscription activated! Welcome to Flexrra 🎉');
    } else {
      toast.error(result.error || 'Failed to subscribe');
    }
  };

  const handlePause = async () => {
    setActionLoading('pause');
    const result = await pauseSubscription();
    setActionLoading(null);
    
    if (result.success) {
      toast.success('Subscription paused. Resume anytime!');
    } else {
      toast.error(result.error || 'Failed to pause subscription');
    }
  };

  const handleResume = async () => {
    setActionLoading('resume');
    const result = await resumeSubscription();
    setActionLoading(null);
    
    if (result.success) {
      toast.success('Subscription resumed! Get back to your workouts 💪');
    } else {
      toast.error(result.error || 'Failed to resume subscription');
    }
  };

  const features = [
    { icon: Zap, text: 'Access 20+ premium gyms' },
    { icon: Clock, text: 'Pause anytime, no commitment' },
    { icon: Shield, text: 'Zero hidden fees' },
    { icon: Sparkles, text: 'Personal training available' },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Subscription <span className="text-gradient">Plans</span>
          </h1>
          <p className="text-muted-foreground">
            One subscription. Unlimited gym access.
          </p>
        </div>

        <div className="mx-auto max-w-lg">
          {/* Current Status Card */}
          {user && subscriptionStatus !== 'inactive' && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Current Status</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    subscriptionStatus === 'active'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {subscriptionStatus === 'active' ? 'Active' : 'Paused'}
                </span>
              </div>
              {subscriptionEndDate && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {subscriptionStatus === 'active' ? 'Expires' : 'Paused until'}: {formatDate(subscriptionEndDate)}
                </p>
              )}
              <div className="flex gap-3">
                {subscriptionStatus === 'active' ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={handlePause}
                    disabled={isLoading || actionLoading !== null}
                  >
                    {actionLoading === 'pause' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Pause className="mr-2 h-4 w-4" />
                    )}
                    Pause Subscription
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="flex-1"
                    onClick={handleResume}
                    disabled={isLoading || actionLoading !== null}
                  >
                    {actionLoading === 'resume' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Resume Subscription
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Plan Card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-card shadow-lg animate-scale-in">
            {/* Badge */}
            <div className="absolute -right-8 top-6 rotate-45 gradient-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
              POPULAR
            </div>

            <div className="p-8">
              {/* Plan Header */}
              <div className="mb-6 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">Monthly Pass</h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">₹999</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-4">
                {features.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {(!user || subscriptionStatus === 'inactive') && (
                <Button
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={isLoading || actionLoading !== null}
                >
                  {actionLoading === 'subscribe' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {user ? 'Subscribe Now' : 'Get Started'}
                    </>
                  )}
                </Button>
              )}

              {subscriptionStatus === 'active' && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-success/10 py-3 text-success">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">You're subscribed!</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-muted/30 px-8 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Cancel or pause anytime. No questions asked.
              </p>
            </div>
          </div>

          {/* FAQs */}
          <div className="mt-8 space-y-4">
            <h3 className="text-center font-semibold text-foreground">Common Questions</h3>
            <div className="space-y-3">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes! You can pause or cancel your subscription at any time with just one click.',
                },
                {
                  q: 'How many gyms can I access?',
                  a: 'You get access to 20+ partner gyms across Delhi, Mumbai, and Bangalore.',
                },
                {
                  q: 'Are there any hidden fees?',
                  a: 'No hidden fees. ₹999/month is all you pay.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-lg border border-border bg-card p-4">
                  <p className="mb-1 font-medium text-foreground">{q}</p>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
