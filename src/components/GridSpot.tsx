import { cn } from '@/lib/utils';
import { formatSol, formatUsd } from '@/lib/price';
import { PlusIcon } from '@heroicons/react/24/outline';

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
    minimumBid: number;
  };
  onClick: () => void;
  solPrice: number;
}

export const GridSpot = ({ spot, onClick, solPrice }: SpotProps) => {
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
          "bg-crypto-primary/5",
          "flex items-center justify-center"
        )}
      >
        {spot.project?.logo ? (
          <img
            src={spot.project.logo}
            alt={spot.project.name}
            className="absolute inset-0 w-full h-full object-contain p-4"
          />
        ) : (
          <PlusIcon className="w-12 h-12 text-gray-400 group-hover:text-crypto-primary transition-colors duration-200" />
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
            <div className="text-sm text-crypto-primary">
              {formatSol(spot.currentPrice)} SOL
              <span className="text-crypto-primary/70">
                {" "}(${formatUsd(spot.currentPrice, solPrice)})
              </span>
            </div>

            {/* Next Minimum */}
            <div className="text-xs text-gray-500">
              Min next: ${formatUsd(spot.minimumBid, solPrice)}
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold text-gray-500">
              {`${spot.id + 1}. Available`}
            </div>
            <div className="text-sm text-crypto-primary">
              {formatSol(spot.currentPrice)} SOL
              <span className="text-crypto-primary/70">
                {" "}(${formatUsd(spot.currentPrice, solPrice)})
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Min next: ${formatUsd(spot.minimumBid, solPrice)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};