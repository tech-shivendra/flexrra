import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useRazorpay } from '@/hooks/useRazorpay';
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
  Calendar,
} from 'lucide-react';

const MONTHLY_PRICE = 1499;
const ANNUAL_PRICE = 14999; // ~17% discount (12 months would be 17,988)
const ANNUAL_MONTHLY_EQUIVALENT = Math.round(ANNUAL_PRICE / 12);
const ANNUAL_SAVINGS = (MONTHLY_PRICE * 12) - ANNUAL_PRICE;

type PlanType = 'monthly' | 'annual';

const Plans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    subscriptionStatus,
    subscriptionEndDate,
    isLoading,
    pauseSubscription,
    resumeSubscription,
  } = useSubscription();
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');

  const handleSubscribe = async (planType: PlanType) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const price = planType === 'monthly' ? MONTHLY_PRICE : ANNUAL_PRICE;
    const description = planType === 'monthly' ? 'Monthly Gym Membership' : 'Annual Gym Membership';
    
    setActionLoading('subscribe');
    
    initiatePayment(
      {
        amount: price,
        name: 'Flexrra',
        description,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
      },
      (response) => {
        console.log('Payment successful:', response);
        toast.success('Payment successful! Welcome to Flexrra 🎉');
        setActionLoading(null);
      },
      (error) => {
        console.error('Payment failed:', error);
        toast.error(error.error || 'Payment failed. Please try again.');
        setActionLoading(null);
      }
    );
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

        <div className="mx-auto max-w-4xl">
          {/* Current Status Card */}
          {user && subscriptionStatus !== 'inactive' && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6 animate-fade-in max-w-lg mx-auto">
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

          {/* Plan Toggle */}
          {(!user || subscriptionStatus === 'inactive') && (
            <div className="mb-8 flex justify-center">
              <div className="inline-flex rounded-full border border-border bg-muted/50 p-1">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    selectedPlan === 'monthly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPlan('annual')}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedPlan === 'annual'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Annual
                  <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-semibold text-success">
                    Save ₹{ANNUAL_SAVINGS.toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Plan Cards */}
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Monthly Plan */}
            <div className={`relative overflow-hidden rounded-2xl border-2 bg-card shadow-lg transition-all duration-300 ${
              selectedPlan === 'monthly' ? 'border-primary scale-[1.02]' : 'border-border opacity-80'
            }`}>
              <div className="p-6">
                <div className="mb-4 text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-foreground">Monthly Pass</h2>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">₹{MONTHLY_PRICE.toLocaleString()}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  {features.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{text}</span>
                    </div>
                  ))}
                </div>

                {(!user || subscriptionStatus === 'inactive') && (
                  <Button
                    variant={selectedPlan === 'monthly' ? 'gradient' : 'outline'}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscribe('monthly')}
                    disabled={isLoading || isPaymentLoading || actionLoading !== null}
                  >
                    {actionLoading === 'subscribe' && selectedPlan === 'monthly' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {user ? `Pay ₹${MONTHLY_PRICE.toLocaleString()}` : 'Get Started'}
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
            </div>

            {/* Annual Plan */}
            <div className={`relative overflow-hidden rounded-2xl border-2 bg-card shadow-lg transition-all duration-300 ${
              selectedPlan === 'annual' ? 'border-primary scale-[1.02]' : 'border-border opacity-80'
            }`}>
              {/* Best Value Badge */}
              <div className="absolute -right-8 top-6 rotate-45 gradient-primary px-10 py-1 text-xs font-semibold text-primary-foreground">
                BEST VALUE
              </div>

              <div className="p-6">
                <div className="mb-4 text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-foreground">Annual Pass</h2>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">₹{ANNUAL_PRICE.toLocaleString()}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="mt-1 text-sm text-success font-medium">
                    ₹{ANNUAL_MONTHLY_EQUIVALENT}/month • Save ₹{ANNUAL_SAVINGS.toLocaleString()}
                  </p>
                </div>

                <div className="mb-6 space-y-3">
                  {features.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{text}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span className="text-sm text-success font-medium">2 months FREE</span>
                  </div>
                </div>

                {(!user || subscriptionStatus === 'inactive') && (
                  <Button
                    variant={selectedPlan === 'annual' ? 'gradient' : 'outline'}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscribe('annual')}
                    disabled={isLoading || isPaymentLoading || actionLoading !== null}
                  >
                    {actionLoading === 'subscribe' && selectedPlan === 'annual' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {user ? `Pay ₹${ANNUAL_PRICE.toLocaleString()}` : 'Get Started'}
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
            </div>
          </div>

          {/* Secure Payment Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure payment powered by Razorpay</span>
          </div>

          {/* Footer Note */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Cancel or pause anytime. No questions asked.
            </p>
          </div>

          {/* FAQs */}
          <div className="mt-12 space-y-4 max-w-lg mx-auto">
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
                  a: `No hidden fees. Monthly is ₹${MONTHLY_PRICE.toLocaleString()}/month, Annual is ₹${ANNUAL_PRICE.toLocaleString()}/year.`,
                },
                {
                  q: 'Is my payment secure?',
                  a: 'Yes! All payments are processed securely through Razorpay, India\'s trusted payment gateway.',
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
