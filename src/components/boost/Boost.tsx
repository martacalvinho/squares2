import * as React from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus, Rocket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { BoostSlotDetails } from '@/components/boost/BoostSlotDetails';
import { formatTimeLeft } from './BoostUtils';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getSolPrice } from '@/lib/price';

// Component types
type Tables = Database['public']['Tables'];
type BoostSlotRow = Tables['boost_slots']['Row'];
type WaitlistRow = Tables['boost_waitlist']['Row'];

export type BoostSlot = {
  id: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string | null;
  chart_link?: string | null;
  start_time: string;
  end_time: string;
  initial_contribution: number;
  contribution_amount: number;
  transaction_signature: string;
  wallet_address: string;
  created_at: string;
};

export type WaitlistProject = {
  id: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string | null;
  chart_link?: string | null;
  contribution_amount: number;
  transaction_signature: string;
  wallet_address: string;
  created_at: string;
};

export const Boost = () => {
  const [slots, setSlots] = useState<BoostSlot[]>([]);
  const [waitlistProjects, setWaitlistProjects] = useState<WaitlistProject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BoostSlot | null>(null);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [isSolPriceLoading, setIsSolPriceLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { connected } = useWallet();
  const { toast } = useToast();

  // Function to handle opening the dialog
  const handleOpenDialog = (slotNumber: number) => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to boost a project",
        variant: "destructive"
      });
      return;
    }

    if (isSolPriceLoading || solPrice <= 0) {
      toast({
        title: "Loading",
        description: "Please wait while we fetch the latest SOL price",
        variant: "destructive"
      });
      return;
    }

    setIsDialogOpen(true);
  };

  // Function to handle closing the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Function to handle clicking on a filled slot
  const handleSlotClick = (slot: BoostSlot) => {
    setSelectedSlot(slot);
  };

  // Function to handle closing the slot details
  const handleCloseDetails = () => {
    setSelectedSlot(null);
  };

  // Function to handle contribution from details
  const handleContributeFromDetails = () => {
    setSelectedSlot(null);
    handleOpenDialog(selectedSlot?.id || 0);
  };

  // Update countdown timer every second
  useEffect(() => {
    if (!slots) return;

    const updateTimers = () => {
      const now = new Date();
      slots.forEach((slot) => {
        const endTime = new Date(slot.end_time);
        if (endTime > now) {
          const timeLeft = formatTimeLeft(slot.end_time);
          // Update UI with timeLeft if needed
        }
      });
    };

    const timer = setInterval(updateTimers, 1000);
    return () => clearInterval(timer);
  }, [slots]);

  // Fetch SOL price
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        setIsSolPriceLoading(true);
        const price = await getSolPrice();
        setSolPrice(price);
      } catch (error) {
        console.error('Error fetching SOL price:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch SOL price. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsSolPriceLoading(false);
      }
    };

    fetchSolPrice();
    // Refresh price every minute
    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  // Subscribe to boost slots changes
  useEffect(() => {
    const boostChannel = supabase
      .channel('boost_slots_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boost_slots'
        },
        async () => {
          // Refresh slots
          const { data } = await supabase
            .from('boost_slots')
            .select(`
              id,
              project_name,
              project_logo,
              project_link,
              telegram_link,
              chart_link,
              start_time,
              end_time,
              initial_contribution,
              created_at
            `)
            .order('end_time', { ascending: false });
          
          if (data) {
            const typedSlots = data.map((slot) => ({
              id: slot.id,
              project_name: slot.project_name,
              project_logo: slot.project_logo,
              project_link: slot.project_link,
              telegram_link: slot.telegram_link,
              chart_link: slot.chart_link,
              start_time: slot.start_time,
              end_time: slot.end_time,
              initial_contribution: slot.initial_contribution || 0,
              contribution_amount: slot.initial_contribution || 0,
              transaction_signature: '',
              wallet_address: '',
              created_at: slot.created_at
            }));
            setSlots(typedSlots);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(boostChannel);
    };
  }, []);

  // Subscribe to waitlist changes
  useEffect(() => {
    const waitlistChannel = supabase
      .channel('waitlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boost_waitlist'
        },
        async () => {
          // Refresh waitlist
          const { data } = await supabase
            .from('boost_waitlist')
            .select(`
              id,
              project_name,
              project_logo,
              project_link,
              telegram_link,
              chart_link,
              contribution_amount,
              transaction_signature,
              wallet_address,
              created_at
            `)
            .order('created_at', { ascending: true });
          
          if (data) {
            const typedWaitlist = data.map((project) => ({
              id: project.id,
              project_name: project.project_name,
              project_logo: project.project_logo,
              project_link: project.project_link,
              telegram_link: project.telegram_link,
              chart_link: project.chart_link,
              contribution_amount: project.contribution_amount || 0,
              transaction_signature: project.transaction_signature || '',
              wallet_address: project.wallet_address || '',
              created_at: project.created_at
            }));
            setWaitlistProjects(typedWaitlist);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(waitlistChannel);
    };
  }, []);

  // Initial fetch of boost slots and waitlist
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch active boost slots
        const { data: boostData, error: boostError } = await supabase
          .from('boost_slots')
          .select(`
            id,
            project_name,
            project_logo,
            project_link,
            telegram_link,
            chart_link,
            start_time,
            end_time,
            initial_contribution,
            created_at
          `)
          .order('end_time', { ascending: false });

        if (boostError) {
          console.error('Error fetching boost slots:', boostError);
          return;
        }

        // Filter out expired slots and convert to BoostSlot type
        const now = new Date();
        const activeSlots = (boostData || [])
          .filter((slot) => new Date(slot.end_time) > now)
          .map((slot) => ({
            id: slot.id,
            project_name: slot.project_name,
            project_logo: slot.project_logo,
            project_link: slot.project_link,
            telegram_link: slot.telegram_link,
            chart_link: slot.chart_link,
            start_time: slot.start_time,
            end_time: slot.end_time,
            initial_contribution: slot.initial_contribution || 0,
            contribution_amount: slot.initial_contribution || 0,
            transaction_signature: '',
            wallet_address: '',
            created_at: slot.created_at
          }));

        // Ensure we only show up to 5 slots
        const displaySlots = activeSlots.slice(0, 5);
        setSlots(displaySlots);

        // Fetch waitlist projects
        const { data: waitlistData, error: waitlistError } = await supabase
          .from('boost_waitlist')
          .select(`
            id,
            project_name,
            project_logo,
            project_link,
            telegram_link,
            chart_link,
            contribution_amount,
            transaction_signature,
            wallet_address,
            created_at
          `)
          .order('created_at', { ascending: true });

        if (waitlistError) {
          console.error('Error fetching waitlist:', waitlistError);
          return;
        }

        // Convert waitlist data to WaitlistProject type
        const typedWaitlist = (waitlistData || []).map((project) => ({
          id: project.id,
          project_name: project.project_name,
          project_logo: project.project_logo,
          project_link: project.project_link,
          telegram_link: project.telegram_link,
          chart_link: project.chart_link,
          contribution_amount: project.contribution_amount || 0,
          transaction_signature: project.transaction_signature || '',
          wallet_address: project.wallet_address || '',
          created_at: project.created_at
        }));

        setWaitlistProjects(typedWaitlist);
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSolPrice = async () => {
      try {
        setIsSolPriceLoading(true);
        const price = await getSolPrice();
        setSolPrice(price);
      } catch (error) {
        console.error('Error fetching SOL price:', error);
        toast({
          title: "Error",
          description: "Failed to fetch SOL price. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsSolPriceLoading(false);
      }
    };

    fetchData();
    fetchSolPrice();
  }, [connected]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-4 h-4 text-crypto-primary" />
        <h2 className="hidden md:block text-xl font-semibold text-crypto-primary">Boosted</h2>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {/* Single Dialog for all slots */}
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedSlot ? 'Add More Boost Time' : 'Boost Your Project'}
                </DialogTitle>
              </DialogHeader>
              <BoostSubmissionForm 
                solPrice={solPrice} 
                onSuccess={handleCloseDialog}
                existingSlot={selectedSlot}
              />
            </DialogContent>
          </Dialog>

          {/* Render all 5 slots */}
          {Array.from({ length: 5 }).map((_, index) => {
            const slot = slots[index]; // Get slot directly from index since they're already sorted
            const isAvailable = !slot;
            
            return (
              <div key={index}>
                {isAvailable ? (
                  <button
                    onClick={() => handleOpenDialog(index + 1)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-crypto-primary"
                    title={connected ? "Boost your project" : "Connect wallet to boost"}
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSlotClick(slot)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-crypto-primary overflow-hidden"
                    title={`${slot.project_name} - ${formatTimeLeft(slot.end_time)}`}
                  >
                    <img
                      src={slot.project_logo}
                      alt={slot.project_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </button>
                )}
              </div>
            );
          })}

          {/* Plus button */}
          <button
            onClick={() => handleOpenDialog(0)}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-crypto-primary"
            title={connected ? "Boost your project" : "Connect wallet to boost"}
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Slot Details Dialog */}
      {selectedSlot && (
        <BoostSlotDetails
          slot={selectedSlot}
          isOpen={!!selectedSlot}
          onClose={handleCloseDetails}
          onContribute={handleContributeFromDetails}
          solPrice={solPrice}
        />
      )}

      {waitlistProjects.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-400">{waitlistProjects.length} projects waiting</span>
          <div className="flex -space-x-2">
            {waitlistProjects.slice(0, 3).map((project, idx) => (
              <div
                key={idx}
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
  );
};