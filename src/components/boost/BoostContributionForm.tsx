import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { submitAdditionalTime } from './BoostUtils';
import type { BoostSlot } from './Boost';

interface BoostContributionFormProps {
  slot: BoostSlot;
  onSuccess?: () => void;
  solPrice: number;
}

export function BoostContributionForm({ slot, onSuccess, solPrice }: BoostContributionFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contribution, setContribution] = useState(5); // Start with minimum $5

  // Calculate available time
  const currentBoostHours = Math.ceil(
    (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / (1000 * 60 * 60)
  );
  const remainingHours = 48 - currentBoostHours;
  const maxContribution = remainingHours * 5; // $5 per hour

  const handleContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : Number(value);
    
    if (numValue > maxContribution) {
      toast({
        title: 'Maximum Time Exceeded',
        description: `Maximum additional contribution is $${maxContribution} (${remainingHours} hours)`,
        variant: 'destructive',
      });
      setContribution(maxContribution);
    } else {
      setContribution(numValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!solPrice || solPrice <= 0) {
      toast({
        title: 'Error',
        description: 'Invalid SOL price. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    if (contribution < 5) {
      toast({
        title: 'Error',
        description: 'Minimum contribution is $5',
        variant: 'destructive',
      });
      return;
    }

    if (contribution > maxContribution) {
      toast({
        title: 'Error',
        description: `Maximum additional contribution is $${maxContribution} (${remainingHours} hours)`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await submitAdditionalTime(
        slot.id,
        contribution,
        wallet,
        connection,
        solPrice
      );

      const additionalHours = Math.floor(contribution / 5);
      const additionalMinutes = Math.round((contribution % 5) * 12);
      
      toast({
        title: 'Success!',
        description: `Added ${additionalHours}h ${additionalMinutes}m boost time!`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error submitting contribution',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeFromContribution = (amount: number) => {
    const hours = Math.floor(amount / 5);
    const minutes = Math.round((amount % 5) * 12);
    return `${hours}h ${minutes}m`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Current boost time:</span>
          <span>{currentBoostHours} hours</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Remaining available:</span>
          <span>{remainingHours} hours</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contribution">
          Contribution Amount (USD)
        </Label>
        <Input
          id="contribution"
          type="number"
          min={0}
          max={maxContribution}
          step={1}
          value={contribution || ''}
          onChange={handleContributionChange}
          required
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Time to add: {getTimeFromContribution(contribution)}</span>
          <span>${contribution}</span>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting || !wallet.connected || contribution < 5 || contribution > maxContribution}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Add Time'}
      </Button>
    </form>
  );
}
