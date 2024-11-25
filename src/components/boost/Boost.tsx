import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { BoostSlots } from '@/components/boost/BoostSlots';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import type { Database } from '@/types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type BoostSlot = Database['public']['Tables']['boost_slots']['Row'];

export const Boost = () => {
  const [slots, setSlots] = useState<BoostSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BoostSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [solPrice, setSolPrice] = useState(0);
  
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

  // Subscribe to boost slots changes
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Initial fetch
      const { data } = await supabase
        .from('boost_slots')
        .select('*')
        .order('slot_number', { ascending: true });
      
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
          (payload) => {
            setSlots(current => {
              if (payload.eventType === 'DELETE') {
                return current.filter(slot => slot.id !== payload.old.id);
              }
              if (payload.eventType === 'INSERT') {
                return [...current, payload.new as BoostSlot];
              }
              if (payload.eventType === 'UPDATE') {
                return current.map(slot => 
                  slot.id === payload.new.id ? (payload.new as BoostSlot) : slot
                );
              }
              return current;
            });
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-crypto-primary">
          Featured Projects
        </h1>
        <p className="text-gray-400 mt-2">
          Boost your project's visibility in our featured slots
        </p>
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