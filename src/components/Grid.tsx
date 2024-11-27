import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpotModal } from './SpotModal';
import { GridSpot } from './GridSpot';
import { SearchFilters } from './SearchFilters';
import { ShareButtons } from './ShareButtons';
import { useAccount } from '@/integrations/wallet/use-account';
import { ActivityFeed } from './ActivityFeed';
import { useDebounce } from '@/hooks/useDebounce';

export const Grid = () => {
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const { isConnected } = useAccount();
  
  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Parse price range
  const priceRangeValues = useMemo(() => {
    if (priceRange === 'all') return null;
    if (priceRange === '50+') return { min: 50, max: null };
    const [min, max] = priceRange.split('-').map(Number);
    return { min, max };
  }, [priceRange]);

  // Fetch spots from Supabase with server-side filtering
  const { data: spots = [], isLoading, error } = useQuery({
    queryKey: ['spots', debouncedSearch, statusFilter, priceRangeValues],
    queryFn: async () => {
      console.log('Fetching spots with filters:', { debouncedSearch, statusFilter, priceRangeValues });
      
      let query = supabase
        .from('spots')
        .select('*')
        .order('id');

      // Apply search filter
      if (debouncedSearch) {
        const isSpotId = !isNaN(Number(debouncedSearch));
        if (isSpotId) {
          query = query.eq('id', Number(debouncedSearch) - 1);
        } else {
          query = query.ilike('project_name', `%${debouncedSearch}%`);
        }
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.is('project_name', statusFilter === 'empty' ? null : 'not.null');
      }

      // Apply price filter
      if (priceRangeValues) {
        if (priceRangeValues.min !== null) {
          query = query.gte('current_bid', priceRangeValues.min);
        }
        if (priceRangeValues.max !== null) {
          query = query.lte('current_bid', priceRangeValues.max);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching spots:', error);
        throw error;
      }

      // Map spots to our format
      return data.map(spot => {
        const startingPrice = 0.005; // $1 equivalent in SOL
        return {
          id: spot.id,
          currentPrice: spot.project_name ? (spot.current_bid || startingPrice) : startingPrice,
          currentOwner: spot.current_bidder,
          project: spot.project_name ? {
            name: spot.project_name,
            link: spot.project_link,
            logo: spot.project_logo
          } : null,
          updatedAt: spot.updated_at
        };
      });
    },
    refetchInterval: 5000
  });

  if (error) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="text-red-500">Error loading spots. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto">      
      <div className="space-y-6">
        <div className="px-4">
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
      
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 px-4">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-crypto-dark/50 rounded-xl h-[140px]" />
                ))
              ) : spots.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-8">
                  No spots found matching your criteria
                </div>
              ) : (
                spots.map((spot) => (
                  <GridSpot
                    key={spot.id}
                    spot={spot}
                    onClick={() => setSelectedSpot(spot.id)}
                  />
                ))
              )}
            </div>
          </div>
          <div className="col-span-3 space-y-8 px-4">
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
      {selectedSpot !== null && (
        <SpotModal
          spotId={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          isConnected={isConnected}
          currentPrice={spots[selectedSpot]?.currentPrice || 0.005}
        />
      )}
    </div>
  );
};