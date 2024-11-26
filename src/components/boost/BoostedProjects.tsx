import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useBoostSlots } from '@/hooks/useBoostSlots';
import { BoostSubmissionForm } from './BoostSubmissionForm';
import { formatTimeLeft } from './BoostUtils';

interface WaitlistProject {
  id: string;
  project_name: string;
  project_logo: string;
}

export function BoostedProjects() {
  const { data, isLoading } = useBoostSlots();
  const { connected } = useWallet();
  const [isBoostDialogOpen, setIsBoostDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  // Update countdown timer every second
  useEffect(() => {
    if (!data?.slots) return;

    const updateTimers = () => {
      const newTimeLeft: { [key: string]: string } = {};
      data.slots.forEach(slot => {
        if (slot.end_time) {
          newTimeLeft[slot.id] = formatTimeLeft(slot.end_time);
        }
      });
      setTimeLeft(newTimeLeft);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [data?.slots]);

  // Render loading circles
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 px-4 overflow-x-auto scrollbar-none">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
        ))}
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4 text-crypto-primary/50" />
        </div>
      </div>
    );
  }

  const featuredProjects = data?.slots || [];
  const waitlistProjects = data?.waitlist || [];

  return (
    <div className="relative border-b border-crypto-primary/10 bg-crypto-dark/95 backdrop-blur-md">
      <div className="flex items-center gap-2 py-2 px-4 overflow-x-auto scrollbar-none">
        {/* Active Boosted Projects */}
        {featuredProjects.map((slot) => (
          <Dialog key={slot.id}>
            <DialogTrigger asChild>
              <button 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all shrink-0 border border-crypto-primary/20 hover:border-crypto-primary/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary/50 relative group"
              >
                {slot.project?.logo ? (
                  <img
                    src={slot.project.logo}
                    alt={slot.project.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-crypto-primary/20" />
                )}
                {/* Time left tooltip */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-crypto-dark px-2 py-1 rounded text-xs text-crypto-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {timeLeft[slot.id]}
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-crypto-dark border-crypto-primary/20">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-3">
                  {slot.project?.logo && (
                    <img
                      src={slot.project.logo}
                      alt={slot.project.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  {slot.project?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {slot.project?.description && (
                  <p className="text-sm text-gray-400">{slot.project.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-crypto-primary">Time Left</div>
                    <div>{timeLeft[slot.id]}</div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="text-crypto-primary">Contributors</div>
                    <div>{slot.contributor_count || 0}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {slot.project?.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={slot.project.website} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </Button>
                  )}
                  {slot.project?.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={slot.project.twitter} target="_blank" rel="noopener noreferrer">
                        Twitter
                      </a>
                    </Button>
                  )}
                  {slot.project?.telegram && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={slot.project.telegram} target="_blank" rel="noopener noreferrer">
                        Telegram
                      </a>
                    </Button>
                  )}
                  {slot.project?.chart && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={slot.project.chart} target="_blank" rel="noopener noreferrer">
                        Chart
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}

        {/* Waitlist Projects (faded) */}
        {waitlistProjects.map((project) => (
          <div
            key={project.id}
            className="w-8 h-8 rounded-full bg-white/5 shrink-0 overflow-hidden opacity-30"
          >
            <img
              src={project.project_logo}
              alt={project.project_name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Add Project Button */}
        <Dialog open={isBoostDialogOpen} onOpenChange={setIsBoostDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all shrink-0 border border-crypto-primary/20 hover:border-crypto-primary/50 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-crypto-primary/50"
              disabled={!connected}
            >
              <Plus className="w-4 h-4 text-crypto-primary" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-crypto-dark border-crypto-primary/20">
            <DialogHeader>
              <DialogTitle>Boost Your Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <BoostSubmissionForm
                onSuccess={() => setIsBoostDialogOpen(false)}
                solPrice={0} // TODO: Add SOL price
              />
              {!connected && (
                <p className="text-sm text-crypto-primary">
                  Please connect your wallet to boost your project.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
