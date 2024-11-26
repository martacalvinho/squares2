import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { formatTimeLeft } from './BoostUtils';
import { RealtimeChannel } from '@supabase/supabase-js';

// Component types
export type BoostSlot = {
  id: string;
  slot_number: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link: string | null;
  chart_link: string | null;
  start_time: string;
  end_time: string;
  initial_contribution: number;
  created_at: string;
  updated_at: string;
  total_contributions?: number;
  contributor_count?: number;
  project?: {
    name: string;
    logo?: string;
    description?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    chart?: string;
  };
};

export type WaitlistProject = {
  id: string;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string;
  chart_link?: string;
  created_at: string;
};

export const Boost = () => {
  const [slots, setSlots] = useState<BoostSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [solPrice, setSolPrice] = useState(0);
  const [waitlistProjects, setWaitlistProjects] = useState<WaitlistProject[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const { connected } = useWallet();

  // Update countdown timer every second
  useEffect(() => {
    if (!slots) return;

    const updateTimers = () => {
      const newTimeLeft: { [key: string]: string } = {};
      slots.forEach(slot => {
        if (slot.end_time) {
          newTimeLeft[slot.id] = formatTimeLeft(slot.end_time);
        }
      });
      setTimeLeft(newTimeLeft);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [slots]);

  // Fetch SOL price
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        setSolPrice(data.solana.usd);
      } catch (error) {
        console.error('Error fetching SOL price:', error);
      }
    };

    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBoostSlots = async () => {
      const { data: boostSlotsData } = await supabase
        .from('boost_slots')
        .select('*')
        .order('slot_number');

      if (boostSlotsData) {
        const typedBoostSlots = (boostSlotsData as any[]).map(row => ({
          ...row,
          project: {
            name: row.project_name,
            logo: row.project_logo,
            website: row.project_link,
            telegram: row.telegram_link || undefined,
            chart: row.chart_link || undefined,
          }
        })) as BoostSlot[];
        setSlots(typedBoostSlots);
      }
    };

    fetchBoostSlots();
  }, []);

  useEffect(() => {
    const fetchWaitlistProjects = async () => {
      const { data: waitlistData } = await supabase
        .from('boost_waitlist')
        .select('*')
        .order('created_at');

      if (waitlistData) {
        const typedWaitlist = (waitlistData as any[]).map(row => ({
          ...row,
          telegram_link: row.telegram_link || undefined,
          chart_link: row.chart_link || undefined,
        })) as WaitlistProject[];
        setWaitlistProjects(typedWaitlist);
      }
    };

    fetchWaitlistProjects();
  }, []);

  useEffect(() => {
    let boostSlotsSubscription: RealtimeChannel;
    
    const setupSubscriptions = () => {
      boostSlotsSubscription = supabase
        .channel('boost_slots_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'boost_slots' },
          async () => {
            const { data: boostSlotsData } = await supabase
              .from('boost_slots')
              .select('*')
              .order('slot_number');

            if (boostSlotsData) {
              const typedBoostSlots = (boostSlotsData as any[]).map(row => ({
                ...row,
                project: {
                  name: row.project_name,
                  logo: row.project_logo,
                  website: row.project_link,
                  telegram: row.telegram_link || undefined,
                  chart: row.chart_link || undefined,
                }
              })) as BoostSlot[];
              setSlots(typedBoostSlots);
            }
          }
        )
        .subscribe();
    };

    setupSubscriptions();
    return () => {
      if (boostSlotsSubscription) {
        supabase.removeChannel(boostSlotsSubscription);
      }
    };
  }, []);

  return (
    <div className="relative border-b border-crypto-primary/10 bg-crypto-dark/95 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-crypto-primary">Crypto 500</h1>
          <div className="flex gap-4">
            {/* Always render 5 circles */}
            {Array.from({ length: 5 }).map((_, index) => {
              const slot = slots[index];
              return (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <button
                      className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden hover:ring-2 hover:ring-crypto-primary transition-all"
                      title={slot ? `${slot.project?.name}\n${timeLeft[slot.id] || ''}` : 'Empty Boost Slot'}
                    >
                      {slot?.project?.logo ? (
                        <img
                          src={slot.project.logo}
                          alt={slot.project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-crypto-primary/20 flex items-center justify-center">
                          <span className="text-sm text-crypto-primary">#{index + 1}</span>
                        </div>
                      )}
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    {slot ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>Boost Your Project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <BoostSubmissionForm
                            onSuccess={() => setIsDialogOpen(false)}
                            solPrice={solPrice}
                            slotNumber={index + 1}
                          />
                          {!connected && (
                            <p className="text-sm text-crypto-primary">
                              Please connect your wallet to boost your project.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              );
            })}

            {/* Add Project Button (always visible) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-shrink-0 w-12 h-12 rounded-full p-0"
                  disabled={!connected}
                  title={connected ? "Boost your project" : "Connect wallet to boost"}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Boost Your Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <BoostSubmissionForm
                    onSuccess={() => setIsDialogOpen(false)}
                    solPrice={solPrice}
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

        {/* Waitlist indicator */}
        {waitlistProjects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{waitlistProjects.length} projects waiting</span>
            <div className="flex -space-x-2">
              {waitlistProjects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="w-6 h-6 rounded-full bg-white/5 shrink-0 overflow-hidden opacity-30 ring-1 ring-crypto-dark"
                >
                  <img
                    src={project.project_logo}
                    alt={project.project_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};