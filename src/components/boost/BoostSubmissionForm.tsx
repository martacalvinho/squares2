import * as React from 'react';
import { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ProjectSubmission, submitBoostProject, submitAdditionalTime } from './BoostUtils';
import type { BoostSlot } from './Boost';
import { formatUrl } from "@/lib/url";

interface BoostSubmissionFormProps {
  onSuccess?: () => void;
  solPrice: number;
  existingSlot?: BoostSlot;
}

export function BoostSubmissionForm({ onSuccess, solPrice, existingSlot }: BoostSubmissionFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate remaining available time if this is an additional contribution
  const currentBoostHours = existingSlot
    ? Math.ceil((new Date(existingSlot.end_time).getTime() - new Date(existingSlot.start_time).getTime()) / (1000 * 60 * 60))
    : 0;
  const remainingHours = 48 - currentBoostHours;
  const maxContribution = remainingHours * 5; // $5 per hour

  // Form state
  const [formData, setFormData] = useState({
    projectName: existingSlot?.project_name || '',
    projectLogo: existingSlot?.project_logo || '',
    projectLink: existingSlot?.project_link || '',
    telegramLink: existingSlot?.telegram_link || '',
    chartLink: existingSlot?.chart_link || '',
    totalContributions: 5 // Minimum $5
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'totalContributions') {
      let numValue = value === '' ? 0 : Number(value);
      
      if (numValue > 240) {
        toast({
          title: 'Maximum Time Exceeded',
          description: 'Maximum boost time is 48 hours ($240)',
          variant: 'destructive',
        });
        numValue = 240;
      }
      
      setFormData(prev => ({ ...prev, [id]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
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

    // Validate contribution amount
    if (formData.totalContributions < 5) {
      toast({
        title: 'Error',
        description: 'Minimum contribution is $5',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!formData.projectName || !formData.projectLink) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Format URLs
      const formattedProjectLink = formatUrl(formData.projectLink);
      const formattedTelegramLink = formData.telegramLink ? formatUrl(formData.telegramLink) : null;
      const formattedChartLink = formData.chartLink ? formatUrl(formData.chartLink) : null;
      const formattedProjectLogo = formData.projectLogo ? formatUrl(formData.projectLogo) : null;

      // Basic URL validation
      try {
        new URL(formattedProjectLink);
        if (formattedTelegramLink) new URL(formattedTelegramLink);
        if (formattedChartLink) new URL(formattedChartLink);
        if (formattedProjectLogo) new URL(formattedProjectLogo);
      } catch {
        throw new Error("Please enter valid URLs");
      }

      if (existingSlot) {
        // Submit additional time
        await submitAdditionalTime(
          existingSlot.id,
          formData.totalContributions,
          wallet,
          connection,
          solPrice
        );

        toast({
          title: 'Success!',
          description: `Added ${calculateBoostTime(formData.totalContributions)} boost time!`,
        });
      } else {
        // Submit new project
        const projectData: ProjectSubmission = {
          project_name: formData.projectName,
          project_logo: formattedProjectLogo,
          project_link: formattedProjectLink,
          telegram_link: formattedTelegramLink || undefined,
          chart_link: formattedChartLink || undefined,
          initial_contribution: formData.totalContributions
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
      }

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
      {!existingSlot ? (
        // New project form fields
        <>
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
        </>
      ) : null}

      <div>
        <Label htmlFor="totalContributions">
          {existingSlot ? 'Additional Time Contribution' : 'Initial Contribution'} (USD)
        </Label>
        <Input
          id="totalContributions"
          type="number"
          min={0}
          max={maxContribution}
          step={1}
          value={formData.totalContributions || ''}
          onChange={handleChange}
          required
        />
        {existingSlot ? (
          <div className="text-sm text-gray-500 mt-1 space-y-1">
            <p>Current boost time: {currentBoostHours} hours</p>
            <p>Remaining available time: {remainingHours} hours</p>
            <p>Maximum additional contribution: ${maxContribution} ({remainingHours} hours)</p>
            <p>Selected time: {calculateBoostTime(formData.totalContributions)}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            Minimum $5 (1 hour). Maximum 48 hours boost time.
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || !wallet.connected}>
        {isSubmitting ? 'Submitting...' : existingSlot ? 'Add More Time' : 'Submit Project'}
      </Button>
    </form>
  );
}

function calculateBoostTime(amount: number) {
  const hours = Math.floor(amount / 5);
  const minutes = Math.round((amount % 5) * 12);
  return `${hours}h ${minutes}m`;
}
