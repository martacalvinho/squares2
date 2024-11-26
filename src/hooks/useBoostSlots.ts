import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';

type BoostSlot = Database['public']['Tables']['boost_slots']['Row'] & {
  total_contributions?: number;
  contributor_count?: number;
  total_hours?: number;
  active?: boolean;
  project?: {
    name: string;
    logo?: string;
    description?: string;
    website?: string;
    twitter?: string;
  };
};

export const useBoostSlots = () => {
  return useQuery({
    queryKey: ['boost-slots'],
    queryFn: async () => {
      const { data: slots, error } = await supabase
        .from('boost_slots')
        .select(`
          *,
          project:project_id (
            name,
            logo,
            description,
            website,
            twitter
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching boost slots:', error);
        throw error;
      }

      console.log('Raw boost slots:', slots);

      // Add active status based on end_time
      const now = new Date();
      const processedSlots = slots.map(slot => ({
        ...slot,
        active: slot.end_time ? new Date(slot.end_time) > now : false
      })) as BoostSlot[];

      console.log('Processed boost slots:', processedSlots);
      console.log('Active boost slots:', processedSlots.filter(slot => slot.active));

      return processedSlots;
    }
  });
};
