import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGyms, Gym } from '@/hooks/useGyms';
import GymCard from '@/components/GymCard';
import AnimatedCard from '@/components/AnimatedCard';
import StatsCounter from '@/components/StatsCounter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, Dumbbell, Sparkles, Building2, Users, Trophy, Clock, ChevronDown } from 'lucide-react';
import heroVideo from '@/assets/gym-hero-video.mp4';
import FloatingShapes from '@/components/FloatingShapes';
import { useParallax } from '@/hooks/useParallax';
const stats = [{
  icon: Building2,
  end: 20,
  suffix: '+',
  label: 'Partner Gyms'
}, {
  icon: Users,
  end: 1000,
  suffix: '+',
  label: 'Active Members'
}, {
  icon: Trophy,
  end: 50,
  suffix: '+',
  label: 'Expert Trainers'
}, {
  icon: Clock,
  end: 24,
  suffix: '/7',
  label: 'Access Hours'
}];
const Home = () => {
  const navigate = useNavigate();
  const scrollY = useParallax();
  const {
    gyms,
    isLoading,
    fetchGyms,
    getCities
  } = useGyms();
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  useEffect(() => {
    // Fetch cities for filter
    const loadCities = async () => {
      const cityList = await getCities();
      setCities(cityList);
    };
    loadCities();
  }, [getCities]);
  useEffect(() => {
    fetchGyms(selectedCity === 'All' ? undefined : selectedCity);
  }, [selectedCity, fetchGyms]);
  useEffect(() => {
    const filtered = gyms.filter(gym => gym.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredGyms(filtered);
  }, [gyms, searchQuery]);
  return <div className="min-h-screen bg-background">
      {/* Hero Section with Video */}
      <div className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Video Background with Parallax */}
        <div 
          className="absolute inset-0 z-0"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="h-[120%] w-full object-cover scale-105"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          {/* Enhanced dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Floating Shapes with Parallax */}
        <div style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
          <FloatingShapes />
        </div>

        {/* Hero Content with Parallax */}
        <div 
          className="relative z-10 w-full py-20 md:py-28 lg:py-32"
          style={{ transform: `translateY(${scrollY * 0.4}px)`, opacity: Math.max(0, 1 - scrollY / 600) }}
        >
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="mb-6 animate-fade-in">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md shadow-lg">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  Premium Fitness Network
                </span>
              </div>
              
              {/* Main Heading */}
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl animate-fade-in" style={{
              animationDelay: '100ms'
            }}>
                Find Your{' '}
                <span className="text-gradient block sm:inline">Fitness</span>
              </h1>
              
              {/* Subheading */}
              <p className="mb-10 text-xl md:text-2xl text-white/85 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{
              animationDelay: '200ms'
            }}>
                Access <span className="font-semibold text-white">20+ premium gyms</span> with one subscription. 
                Work out anywhere, anytime, with complete flexibility.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{
              animationDelay: '300ms'
            }}>
                <Button size="xl" className="rounded-full px-10 py-6 text-lg font-semibold shadow-2xl shadow-primary/30 hover:scale-105 hover:shadow-primary/50 transition-all duration-300" onClick={() => navigate('/plans')}>
                  <Dumbbell className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Button>
                <Button variant="outline" size="xl" className="rounded-full px-10 py-6 text-lg font-semibold border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md hover:scale-105 transition-all duration-300" onClick={() => document.getElementById('gym-grid')?.scrollIntoView({
                behavior: 'smooth'
              })}>
                  Explore Gyms
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap justify-center gap-6 animate-fade-in" style={{
              animationDelay: '400ms'
            }}>
                <div className="flex items-center gap-2 text-white/70">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm">No hidden fees</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm">Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm">Instant access</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mx-auto mb-6 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input type="text" placeholder="Search gyms by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-14 rounded-xl border-white/20 bg-white/10 pl-12 text-white placeholder:text-white/60 shadow-lg backdrop-blur-md focus:border-primary focus:bg-white/20" />
              </div>
            </div>

            {/* City Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant={selectedCity === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCity('All')} className={`rounded-full ${selectedCity !== 'All' ? 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white' : ''}`}>
                All
              </Button>
              {cities.map(city => <Button key={city} variant={selectedCity === city ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCity(city)} className={`rounded-full ${selectedCity !== city ? 'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white' : ''}`}>
                  <MapPin className="mr-1 h-3 w-3" />
                  {city}
                </Button>)}
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 cursor-pointer animate-fade-in"
          style={{ animationDelay: '500ms' }}
          onClick={() => document.getElementById('gym-grid')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
            <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
            <ChevronDown className="h-6 w-6 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Stats Section - Hide when searching */}
      {!searchQuery && (
        <div className="bg-card/50 border-y border-border py-12">
          <div className="container mx-auto px-4">
            <StatsCounter stats={stats} />
          </div>
        </div>
      )}

      {/* Gym Grid */}
      <div id="gym-grid" className="container mx-auto px-4 py-8">
        {isLoading ? <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : filteredGyms.length === 0 ? <div className="py-20 text-center">
            <div className="mb-4 text-5xl">🏋️</div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">No gyms found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? `No gyms matching "${searchQuery}"` : selectedCity !== 'All' ? `No gyms available in ${selectedCity}` : 'No gyms have been added yet. Check back soon!'}
            </p>
          </div> : <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredGyms.length}</span> gyms
                {selectedCity !== 'All' && ` in ${selectedCity}`}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGyms.map((gym, index) => <AnimatedCard key={gym._id} delay={index * 100}>
                  <GymCard gym={gym} />
                </AnimatedCard>)}
            </div>
          </>}
      </div>
    </div>;
};
export default Home;