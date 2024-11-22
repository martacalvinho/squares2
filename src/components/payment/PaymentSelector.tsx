import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PaymentSelectorProps {
  currentBid: number;
  calculatedBidAmount: number | null;
  solPrice: number | null;
  onSubmit: () => Promise<void>;
}

export const PaymentSelector = ({
  currentBid,
  calculatedBidAmount,
  solPrice,
  onSubmit,
}: PaymentSelectorProps) => {
  if (!calculatedBidAmount || !solPrice) {
    return <div>Loading bid calculation...</div>;
  }

  const currentBidUSD = currentBid * solPrice;
  const newBidUSD = calculatedBidAmount * solPrice;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="p-4 rounded-lg bg-crypto-dark/50">
          <p className="text-sm text-gray-400">Current Bid</p>
          <p className="text-lg font-bold">{currentBid.toFixed(6)} SOL</p>
          <p className="text-sm text-gray-400">(≈ ${currentBidUSD.toFixed(2)} USD)</p>
        </div>

        <div className="p-4 rounded-lg bg-crypto-primary/10">
          <p className="text-sm text-gray-400">Your Bid (Current + $1)</p>
          <p className="text-lg font-bold">{calculatedBidAmount.toFixed(6)} SOL</p>
          <p className="text-sm text-gray-400">(≈ ${newBidUSD.toFixed(2)} USD)</p>
        </div>

        <p className="text-sm text-gray-400">
          Network: Solana {process.env.NODE_ENV === 'development' ? 'Devnet' : 'Mainnet'}
        </p>
      </div>

      <Button 
        onClick={onSubmit}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        Place Bid
      </Button>
    </div>
  );
};