import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGyms, Gym } from '@/hooks/useGyms';
import GymCard from '@/components/GymCard';
import AnimatedCard from '@/components/AnimatedCard';
import StatsCounter from '@/components/StatsCounter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, Dumbbell, Sparkles, Building2, Users, Trophy, Clock } from 'lucide-react';
import heroVideo from '@/assets/gym-hero-video.mp4';

const cities = ['All', 'Lucknow'];

const stats = [
  { icon: Building2, end: 20, suffix: '+', label: 'Partner Gyms' },
  { icon: Users, end: 1000, suffix: '+', label: 'Active Members' },
  { icon: Trophy, end: 50, suffix: '+', label: 'Expert Trainers' },
  { icon: Clock, end: 24, suffix: '/7', label: 'Access Hours' },
];

const Home = () => {
  const navigate = useNavigate();
  const { gyms, isLoading, fetchGyms } = useGyms();
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);

  useEffect(() => {
    fetchGyms(selectedCity === 'All' ? undefined : selectedCity);
  }, [selectedCity, fetchGyms]);

  useEffect(() => {
    const filtered = gyms.filter((gym) =>
      gym.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredGyms(filtered);
  }, [gyms, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Video */}
      <div className="relative overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 pb-12 pt-10">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm animate-fade-in">
                <Sparkles className="h-4 w-4 text-primary" />
                Premium Fitness Network
              </p>
              <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: '100ms' }}>
                Find Your <span className="text-gradient">Perfect Gym</span>
              </h1>
              <p className="mb-8 text-lg text-white/80 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
                Access 20+ premium gyms with one subscription. Work out anywhere, anytime.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <Button 
                  size="lg" 
                  className="rounded-full px-8 shadow-lg hover:scale-105 transition-transform"
                  onClick={() => navigate('/plans')}
                >
                  <Dumbbell className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full px-8 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm hover:scale-105 transition-transform"
                  onClick={() => document.getElementById('gym-grid')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore Gyms
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mx-auto mb-6 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search gyms by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 rounded-xl border-white/20 bg-white/10 pl-12 text-white placeholder:text-white/60 shadow-lg backdrop-blur-md focus:border-primary focus:bg-white/20"
                />
              </div>
            </div>

            {/* City Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCity(city)}
                  className={`rounded-full ${
                    selectedCity !== city
                      ? 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white'
                      : ''
                  }`}
                >
                  {city !== 'All' && <MapPin className="mr-1 h-3 w-3" />}
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-card/50 border-y border-border py-12">
        <div className="container mx-auto px-4">
          <StatsCounter stats={stats} />
        </div>
      </div>

      {/* Gym Grid */}
      <div id="gym-grid" className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredGyms.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-5xl">🏋️</div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">No gyms found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? `No gyms matching "${searchQuery}"`
                : `No gyms available in ${selectedCity}`}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredGyms.length}</span> gyms
                {selectedCity !== 'All' && ` in ${selectedCity}`}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGyms.map((gym, index) => (
                <AnimatedCard key={gym._id} delay={index * 100}>
                  <GymCard gym={gym} />
                </AnimatedCard>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
