import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, ArrowRight, Check, MapPin, Clock, Pause } from "lucide-react";

const Index = () => {
  const features = [
    { icon: MapPin, title: "20+ Gyms", desc: "Access premium gyms across cities" },
    { icon: Clock, title: "Flexible Hours", desc: "Work out on your schedule" },
    { icon: Pause, title: "Pause Anytime", desc: "No long-term commitments" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-hero">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
                <Dumbbell className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="text-3xl font-bold text-gradient">Flexrra</span>
            </div>

            {/* Headline */}
            <h1 className="mb-4 max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              One Subscription.{" "}
              <span className="text-gradient">Unlimited Gyms.</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              Access 20+ premium gyms across Delhi, Mumbai & Bangalore with a single
              ₹999/month membership. Pause anytime.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/signup">
                <Button variant="gradient" size="xl">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="xl">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" />
                No hidden fees
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-2xl font-bold text-foreground md:text-3xl">
          Why Choose Flexrra?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-8 text-center transition-all hover:-translate-y-1 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
              <p className="text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mb-8 text-muted-foreground">
            One plan, unlimited possibilities
          </p>
          <div className="mx-auto inline-block rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
            <div className="mb-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-foreground">₹999</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mb-6 space-y-2 text-left">
              {[
                "Access to 20+ partner gyms",
                "Pause or cancel anytime",
                "No enrollment fees",
                "Workout tracking",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button variant="gradient" size="lg" className="w-full">
                Start Your Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Flexrra</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Flexrra. Flexible gym memberships for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
