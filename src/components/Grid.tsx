import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpotModal } from './SpotModal';
import { GridSpot } from './GridSpot';
import { ActivityFeed } from './ActivityFeed';
import { SearchFilters } from './SearchFilters';
import { Comments } from './Comments';
import { ShareButtons } from './ShareButtons';
import { Boost } from './boost/Boost';
import { useAccount } from '@/integrations/wallet/use-account';
import { MobileDropdown } from './MobileDropdown';
import { getStartingPrice, getMinimumBid, getSolPrice } from '@/lib/price';

interface Spot {
  id: number;
  currentPrice: number;
  currentOwner: string | null;
  project: {
    name: string;
    link: string;
    logo: string;
  } | null;
  updatedAt: string;
  minimumBid?: number;
}

export const Grid = () => {
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [solPrice, setSolPrice] = useState<number>(100); // Default price
  const { isConnected } = useAccount();

  // Fetch spots from Supabase
  const { data: spots = [], isLoading } = useQuery({
    queryKey: ['spots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching spots:', error);
        throw error;
      }

      // Map spots to our format
      return data.map(spot => ({
        id: spot.id,
        currentPrice: spot.current_bid || getStartingPrice(),
        currentOwner: spot.current_bidder,
        project: spot.project_name ? {
          name: spot.project_name,
          link: spot.project_link,
          logo: spot.project_logo
        } : null,
        updatedAt: spot.updated_at,
        minimumBid: spot.current_bid ? getMinimumBid(spot.current_bid) : getStartingPrice()
      }));
    },
    refetchInterval: 5000
  });

  // Fetch SOL price
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getSolPrice();
      setSolPrice(price);
    };
    
    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Filter spots based on search term and filters
  const filteredSpots = spots.filter(spot => {
    // Search term filter
    const searchMatch = !searchTerm || 
      (spot.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (spot.id + 1).toString() === searchTerm);

    // Status filter
    const statusMatch = statusFilter === 'all' ||
      (statusFilter === 'occupied' && spot.currentOwner) ||
      (statusFilter === 'empty' && !spot.currentOwner);

    // Price range filter
    let priceMatch = true;
    if (priceRange !== 'all') {
      const [min, max] = priceRange === '50+' 
        ? [50, Infinity] 
        : priceRange.split('-').map(Number);
      priceMatch = spot.currentPrice >= min && spot.currentPrice <= max;
    }

    return searchMatch && statusMatch && priceMatch;
  });

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="text-crypto-primary">Loading spots...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto p-4">
      <div className="mt-4 mb-8">
        <Boost />
      </div>
      
      <div className="space-y-6">
        {/* Mobile Dropdown */}
        <MobileDropdown />

        <div>
          <h2 className="text-xl font-semibold text-crypto-primary mb-2">Available Spots</h2>
          <p className="text-sm text-gray-400 mb-4">Claim one of the top 500 spots on Solana</p>
          <SearchFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-9">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 md:gap-8 animate-fade-in">
              {filteredSpots.map((spot) => (
                <GridSpot
                  key={spot.id}
                  spot={spot}
                  onClick={() => setSelectedSpot(spot.id)}
                  solPrice={solPrice}
                />
              ))}
            </div>
          </div>
          <div className="hidden md:block md:col-span-3 space-y-8">
            <div className="glass-effect rounded-xl p-4">
              <ActivityFeed />
            </div>
            {selectedSpot !== null && (
              <div className="glass-effect rounded-xl p-4">
                <h3 className="text-lg font-semibold text-crypto-primary mb-4">
                  Share Spot #{selectedSpot + 1}
                </h3>
                <ShareButtons spotId={selectedSpot} />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSpot !== null && spots[selectedSpot] && (
        <SpotModal
          spotId={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          isConnected={isConnected}
          currentPrice={spots[selectedSpot]?.currentPrice || getStartingPrice()}
          minimumBid={spots[selectedSpot]?.minimumBid || getStartingPrice()}
        />
      )}
    </div>
  );
};