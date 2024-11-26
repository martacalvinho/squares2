import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Globe, ChartLine, MessageCircle } from 'lucide-react';
import { formatTimeLeft } from './BoostUtils';
import { supabase } from '@/integrations/supabase/client';
import type { BoostSlot } from './Boost';
import { BoostContributionForm } from './BoostContributionForm';

interface BoostSlotDetailsProps {
  slot: BoostSlot;
  isOpen: boolean;
  onClose: () => void;
  solPrice: number;
}

interface Contributor {
  wallet_address: string;
  amount: number;
  transaction_signature: string;
}

export const BoostSlotDetails = ({ slot, isOpen, onClose, solPrice }: BoostSlotDetailsProps) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [totalContribution, setTotalContribution] = useState(slot.initial_contribution);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const { connected } = useWallet();

  useEffect(() => {
    const fetchContributors = async () => {
      const { data, error } = await supabase
        .from('boost_contributions')
        .select('wallet_address, amount, transaction_signature')
        .eq('slot_id', slot.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching contributors:', error);
        return;
      }

      if (data) {
        setContributors(data);
        const total = data.reduce((sum, contribution) => sum + contribution.amount, 0);
        setTotalContribution(total);
      }
    };

    if (isOpen) {
      fetchContributors();
    }
  }, [slot.id, isOpen]);

  // Calculate remaining boost time
  const timeLeft = formatTimeLeft(slot.end_time);
  const currentBoostHours = Math.ceil((new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / (1000 * 60 * 60));
  const canContribute = currentBoostHours < 48;

  const handleContributionSuccess = () => {
    setIsContributionDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={slot.project_logo} alt={slot.project_name} className="w-8 h-8 rounded-full" />
              <span>{slot.project_name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Time Left */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{timeLeft}</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              {slot.project_link && (
                <a
                  href={slot.project_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-crypto-primary hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
              {slot.chart_link && (
                <a
                  href={slot.chart_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-crypto-primary hover:underline"
                >
                  <ChartLine className="w-4 h-4" />
                  Chart
                </a>
              )}
              {slot.telegram_link && (
                <a
                  href={slot.telegram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-crypto-primary hover:underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  Telegram
                </a>
              )}
            </div>

            {/* Contributors */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Contributors ({contributors.length})</h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {contributors.map((contributor, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {contributor.wallet_address.slice(0, 4)}...{contributor.wallet_address.slice(-4)}
                    </span>
                    <span>${contributor.amount}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                <span>Total</span>
                <span>${totalContribution}</span>
              </div>
            </div>

            {/* Contribute Button */}
            {canContribute ? (
              <Button
                onClick={() => setIsContributionDialogOpen(true)}
                disabled={!connected}
                className="w-full"
              >
                {connected ? 'Contribute More Time' : 'Connect Wallet to Contribute'}
              </Button>
            ) : (
              <div className="text-sm text-gray-500 text-center">
                Maximum boost time (48 hours) reached
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribution Dialog */}
      <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add More Boost Time</DialogTitle>
          </DialogHeader>
          <BoostContributionForm
            slot={slot}
            onSuccess={handleContributionSuccess}
            solPrice={solPrice}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
