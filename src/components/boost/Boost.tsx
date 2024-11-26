import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { BoostSlots } from '@/components/boost/BoostSlots';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import type { Database } from '@/types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type BoostSlot = Database['public']['Tables']['boost_slots']['Row'] & {
  total_contributions?: number;
  contributor_count?: number;
};

export const Boost = () => {
  const [slots, setSlots] = useState<BoostSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BoostSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [solPrice, setSolPrice] = useState(0);
  const [waitlistProjects, setWaitlistProjects] = useState<any[]>([]);
  
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

  // Fetch waitlist projects
  useEffect(() => {
    const fetchWaitlist = async () => {
      const { data } = await supabase
        .from('boost_waitlist')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) setWaitlistProjects(data);
    };

    fetchWaitlist();

    // Subscribe to waitlist changes
    const channel = supabase
      .channel('waitlist_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boost_waitlist'
        },
        () => {
          fetchWaitlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to boost slots changes
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      console.log('Fetching boost slots...');
      // Initial fetch
      const { data, error } = await supabase
        .from('boost_slots')
        .select('*')
        .order('slot_number', { ascending: true });
      
      console.log('Fetched boost slots:', data);
      console.log('Error if any:', error);
      
      if (error) {
        console.error('Error fetching boost slots:', error);
        return;
      }
      
      if (data) setSlots(data);

      // Setup realtime subscription
      channel = supabase
        .channel('boost_slots_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'boost_slots'
          },
          async (payload) => {
            console.log('Boost slots changed:', payload);
            // Fetch all slots
            const { data: updatedSlots, error: updateError } = await supabase
              .from('boost_slots')
              .select('*')
              .order('slot_number', { ascending: true });
            
            console.log('Updated boost slots:', updatedSlots);
            console.log('Update error if any:', updateError);
            
            if (updateError) {
              console.error('Error fetching updated boost slots:', updateError);
              return;
            }
            
            if (updatedSlots) {
              setSlots(updatedSlots);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleSlotClick = (slot: BoostSlot | null) => {
    if (!slot) {
      setIsDialogOpen(true);
    }
  };

  const handleSubmissionSuccess = () => {
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-crypto-primary">
            Boost Queue
          </h1>
          {waitlistProjects.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <div className="flex -space-x-2">
                {waitlistProjects.slice(0, 3).map((project, index) => (
                  <div
                    key={project.id}
                    className="w-5 h-5 rounded-full border-2 border-white bg-crypto-dark overflow-hidden"
                    style={{ zIndex: 3 - index }}
                  >
                    <img
                      src={project.project_logo}
                      alt={project.project_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {waitlistProjects.length > 3 && (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white bg-crypto-dark flex items-center justify-center text-[10px] text-white"
                    style={{ zIndex: 0 }}
                  >
                    +{waitlistProjects.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {waitlistProjects.length} waiting
              </span>
            </div>
          )}
        </div>
      </div>

      <BoostSlots
        slots={slots}
        onSlotClick={handleSlotClick}
        solPrice={solPrice}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <h2 className="text-xl font-semibold mb-4">
            Boost Your Project
          </h2>
          <BoostSubmissionForm
            onSuccess={handleSubmissionSuccess}
            solPrice={solPrice}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};