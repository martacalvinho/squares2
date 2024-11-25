import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ProjectSubmission, submitBoostProject } from './BoostUtils';

interface BoostSubmissionFormProps {
  onSuccess?: () => void;
  solPrice: number;
}

export function BoostSubmissionForm({ onSuccess, solPrice }: BoostSubmissionFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    projectLogo: '',
    projectLink: '',
    telegramLink: '',
    chartLink: '',
    totalContributions: 5 // Minimum $5
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'totalContributions' ? Number(value) : value
    }));
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

    try {
      setIsSubmitting(true);
      
      // In BoostSubmissionForm.tsx
      const projectData: ProjectSubmission = {
        project_name: formData.projectName,
        project_logo: formData.projectLogo,
        project_link: formData.projectLink,
        telegram_link: formData.telegramLink || undefined,
        chart_link: formData.chartLink || undefined,
        initial_contribution: formData.totalContributions  // Changed from total_contributions
      };

      const result = await submitBoostProject(
        projectData,
        wallet,
        connection,
        solPrice
      );

      toast({
        title: 'Success!',
        description: result.type === 'boosted' 
          ? `Your project has been boosted in slot ${result.slot}!`
          : 'Your project has been added to the waitlist.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error submitting project',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="projectName">Project Name</Label>
        <Input
          id="projectName"
          value={formData.projectName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="projectLogo">Project Logo URL</Label>
        <Input
          id="projectLogo"
          type="url"
          value={formData.projectLogo}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="projectLink">Project Website</Label>
        <Input
          id="projectLink"
          type="url"
          value={formData.projectLink}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="telegramLink">Telegram Link (Optional)</Label>
        <Input
          id="telegramLink"
          type="url"
          value={formData.telegramLink}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="chartLink">Chart Link (Optional)</Label>
        <Input
          id="chartLink"
          type="url"
          value={formData.chartLink}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="totalContributions">Contribution Amount (USD)</Label>
        <Input
          id="totalContributions"
          type="number"
          min={5}
          step={1}
          value={formData.totalContributions}
          onChange={handleChange}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Minimum $5 (1 hour). Maximum 48 hours boost time.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || !wallet.connected}>
        {isSubmitting ? 'Submitting...' : 'Submit Project'}
      </Button>
    </form>
  );
}

function calculateBoostTime(amount: number) {
  const hours = Math.floor(amount / 5);
  const minutes = Math.round((amount % 5) * 12);
  return `${hours}h ${minutes}m`;
}
