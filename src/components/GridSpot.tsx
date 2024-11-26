import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Cache for SOL price
let lastPrice: number | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

const fetchSolPriceWithCache = async (): Promise<number> => {
  const now = Date.now();
  
  // Return cached price if available and fresh
  if (lastPrice && (now - lastFetchTime) < CACHE_DURATION) {
    return lastPrice;
  }

  try {
    // Try Binance API first
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
      if (response.ok) {
        const data = await response.json();
        lastPrice = parseFloat(data.price);
        lastFetchTime = now;
        return lastPrice;
      }
    } catch (e: unknown) {
      console.warn('Binance API failed, trying fallback:', e instanceof Error ? e.message : 'Unknown error');
    }

    // Fallback to Jupiter API
    try {
      const response = await fetch('https://price.jup.ag/v4/price?ids=SOL');
      if (response.ok) {
        const data = await response.json();
        const price = data.data.SOL.price;
        if (typeof price === 'number' && !isNaN(price)) {
          lastPrice = price;
          lastFetchTime = now;
          return price;
        }
      }
    } catch (e: unknown) {
      console.warn('Jupiter API failed:', e instanceof Error ? e.message : 'Unknown error');
    }

    // If both APIs fail and we have a cached price, use it even if expired
    if (lastPrice !== null && !isNaN(lastPrice)) {
      console.warn('Using expired cached price');
      return lastPrice;
    }

    // If both APIs fail and we don't have a cached price, use a hardcoded approximate price
    const fallbackPrice = 95; // Approximate SOL price
    lastPrice = fallbackPrice;
    return fallbackPrice;
  } catch (error: unknown) {
    console.error('Error fetching SOL price:', error instanceof Error ? error.message : 'Unknown error');
    return lastPrice || 95; // Return cached price or fallback
  }
};

interface SpotProps {
  spot: {
    id: number;
    currentPrice: number;
    currentOwner: string | null;
    project: {
      name: string;
      link: string;
      logo: string;
    } | null;
    walletAddress: string | null;
  };
  onClick: () => void;
}

export const GridSpot = ({ spot, onClick }: SpotProps) => {
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    const updatePrice = async () => {
      const price = await fetchSolPriceWithCache();
      setSolPrice(price);
    };
    
    updatePrice();
    
    // Update price every minute
    const interval = setInterval(updatePrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const usdValue = solPrice ? spot.currentPrice * solPrice : null;
  const nextMinimumUsd = usdValue ? usdValue + 1 : null;

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatSolPrice = (price: number | undefined | null) => {
    if (typeof price !== 'number') return '0.0000';
    return price.toFixed(4);
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Logo Square */}
      <div
        onClick={onClick}
        className={cn(
          "relative aspect-square w-full",
          "rounded-xl overflow-hidden",
          "group transition-all duration-300",
          "hover:scale-105 cursor-pointer",
          "bg-crypto-primary/5"
        )}
      >
        {spot.project?.logo && (
          <img
            src={spot.project.logo}
            alt={spot.project.name}
            className="absolute inset-0 w-full h-full object-contain p-4"
          />
        )}
      </div>

      {/* Info Section */}
      <div className="text-center space-y-2">
        {spot.project ? (
          <>
            {/* Project Name with Number */}
            <div className="font-semibold text-crypto-primary">
              <span className="text-gray-500">{`${spot.id + 1}. `}</span>
              <a 
                href={spot.project.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {spot.project.name}
              </a>
            </div>
            
            {/* Current Price */}
            <div className={cn(
              "text-sm",
              "text-crypto-primary"
            )}>
              {formatSolPrice(spot.currentPrice)} SOL
              {usdValue && (
                <span className="text-crypto-primary/70">
                  {" "}(${formatPrice(usdValue)})
                </span>
              )}
            </div>

            {/* Next Minimum */}
            {nextMinimumUsd && (
              <div className="text-xs text-gray-500">
                Min next: ${formatPrice(nextMinimumUsd)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="font-semibold text-gray-500">
              {`${spot.id + 1}. Available`}
            </div>
            <div className="text-sm text-crypto-primary">
              {formatSolPrice(spot.currentPrice)} SOL
              {usdValue && (
                <span className="text-crypto-primary/70">
                  {" "}(${formatPrice(usdValue)})
                </span>
              )}
            </div>
            {nextMinimumUsd && (
              <div className="text-xs text-gray-500">
                Min next: ${formatPrice(nextMinimumUsd)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};