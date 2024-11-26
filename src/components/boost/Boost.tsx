import * as React from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus, Rocket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { formatTimeLeft } from './BoostUtils';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Component types
type Tables = Database['public']['Tables'];
type BoostSlotRow = Tables['boost_slots']['Row'];
type WaitlistRow = Tables['boost_waitlist']['Row'];

export type BoostSlot = BoostSlotRow & {
  contribution_amount: number;
  transaction_signature: string;
  wallet_address: string;
};

export type WaitlistProject = {
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string | null;
  chart_link?: string | null;
  contribution_amount: number;
  transaction_signature: string;
  wallet_address: string;
};

export const Boost = () => {
  const [slots, setSlots] = useState<BoostSlot[]>([]);
  const [waitlistProjects, setWaitlistProjects] = useState<WaitlistProject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [solPrice, setSolPrice] = useState<number>(0);
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
    setIsDialogOpen(true);
  };

  // Function to handle closing the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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
            .select('*')
            .order('slot_number');
          
          if (data) {
            const typedSlots = data.map((slot: BoostSlotRow) => ({
              ...slot,
              contribution_amount: slot.initial_contribution || 0,
              transaction_signature: '',
              wallet_address: ''
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
      .channel('waitlist_channel')
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
            .select('*')
            .order('created_at');
          
          if (data) {
            const typedWaitlist = data.map((project: WaitlistRow) => ({
              project_name: project.project_name,
              project_logo: project.project_logo,
              project_link: project.project_link,
              telegram_link: project.telegram_link,
              chart_link: project.chart_link,
              contribution_amount: project.contribution_amount || 0,
              transaction_signature: project.transaction_signature || '',
              wallet_address: project.wallet_address || ''
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

  // Fetch SOL price
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data?.solana?.usd) {
          setSolPrice(Number(data.solana.usd));
        } else {
          throw new Error('Invalid price data');
        }
      } catch (error) {
        console.error('Error fetching SOL price:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch SOL price. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    fetchSolPrice();
    // Refresh price every minute
    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  // Initial fetch of boost slots and waitlist
  useEffect(() => {
    const fetchData = async () => {
      // Fetch boost slots
      const { data: slotsData } = await supabase
        .from('boost_slots')
        .select('*')
        .order('slot_number');
      
      if (slotsData) {
        const typedSlots = slotsData.map((slot: BoostSlotRow) => ({
          ...slot,
          contribution_amount: slot.initial_contribution || 0,
          transaction_signature: '',
          wallet_address: ''
        }));
        setSlots(typedSlots);
      }

      // Fetch waitlist
      const { data: waitlistData } = await supabase
        .from('boost_waitlist')
        .select('*')
        .order('created_at');
      
      if (waitlistData) {
        const typedWaitlist = waitlistData.map((project: WaitlistRow) => ({
          project_name: project.project_name,
          project_logo: project.project_logo,
          project_link: project.project_link,
          telegram_link: project.telegram_link,
          chart_link: project.chart_link,
          contribution_amount: project.contribution_amount || 0,
          transaction_signature: project.transaction_signature || '',
          wallet_address: project.wallet_address || ''
        }));
        setWaitlistProjects(typedWaitlist);
      }
    };

    fetchData();
  }, []);

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
                <DialogTitle>Boost Your Project</DialogTitle>
              </DialogHeader>
              <BoostSubmissionForm solPrice={solPrice} onSuccess={handleCloseDialog} />
            </DialogContent>
          </Dialog>

          {/* Render all 5 slots */}
          {Array.from({ length: 5 }).map((_, index) => {
            const slot = slots.find(s => s.slot_number === index + 1);
            const isAvailable = !slot;
            
            return (
              <div key={index}>
                {isAvailable ? (
                  <button
                    onClick={() => handleOpenDialog(index + 1)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-crypto-primary"
                    title={connected ? "Boost your project" : "Connect wallet to boost"}
                  >
                    <span className="text-sm text-gray-400">#{index + 1}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenDialog(index + 1)}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-crypto-primary"
                    title={slot.project_name}
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