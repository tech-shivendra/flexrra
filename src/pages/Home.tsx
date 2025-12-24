import { useEffect, useState } from 'react';
import { useGyms, Gym } from '@/hooks/useGyms';
import GymCard from '@/components/GymCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';

const cities = ['All', 'Lucknow'];

const Home = () => {
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
      {/* Hero Section */}
      <div className="gradient-hero pb-8 pt-6">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
              Find Your <span className="text-gradient">Perfect Gym</span>
            </h1>
            <p className="text-muted-foreground">
              Access 20+ premium gyms with one subscription
            </p>
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
                className="h-12 rounded-xl border-border bg-card pl-12 shadow-sm focus:border-primary"
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
                className="rounded-full"
              >
                {city !== 'All' && <MapPin className="mr-1 h-3 w-3" />}
                {city}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Gym Grid */}
      <div className="container mx-auto px-4 py-8">
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
                <div
                  key={gym._id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <GymCard gym={gym} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
