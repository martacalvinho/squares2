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
    telegram?: string;
    chart?: string;
  };
};

type WaitlistProject = {
  id: string;
  project_name: string;
  project_logo: string;
  contribution_amount: number;
  created_at: string;
};

export const useBoostSlots = () => {
  return useQuery({
    queryKey: ['boost-slots'],
    queryFn: async () => {
      // Fetch active boost slots
      const { data: slots, error: slotsError } = await supabase
        .from('boost_slots')
        .select(`
          *,
          project:project_id (
            name,
            logo,
            description,
            website,
            twitter,
            telegram,
            chart
          )
        `)
        .order('slot_number', { ascending: true });

      if (slotsError) {
        console.error('Error fetching boost slots:', slotsError);
        throw slotsError;
      }

      // Fetch waitlist projects
      const { data: waitlist, error: waitlistError } = await supabase
        .from('boost_waitlist')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(5);

      if (waitlistError) {
        console.error('Error fetching waitlist:', waitlistError);
        throw waitlistError;
      }

      console.log('Raw boost slots:', slots);
      console.log('Waitlist projects:', waitlist);

      // Add active status based on end_time
      const now = new Date();
      const processedSlots = slots.map(slot => ({
        ...slot,
        active: slot.end_time ? new Date(slot.end_time) > now : false
      })) as BoostSlot[];

      // Process expired slots and promote waitlist projects
      const expiredSlots = processedSlots.filter(slot => !slot.active);
      if (expiredSlots.length > 0 && waitlist.length > 0) {
        console.log('Found expired slots:', expiredSlots);
        console.log('Available waitlist projects:', waitlist);

        // Delete expired slots
        for (const expiredSlot of expiredSlots) {
          const { error: deleteError } = await supabase
            .from('boost_slots')
            .delete()
            .eq('id', expiredSlot.id);

          if (deleteError) {
            console.error('Error deleting expired slot:', deleteError);
            continue;
          }

          // Promote next waitlist project
          const nextProject = waitlist[0];
          if (nextProject) {
            const startTime = new Date();
            const hoursToAdd = nextProject.contribution_amount * 20; // 0.05 SOL = 1 hour
            const endTime = new Date(startTime.getTime() + (hoursToAdd * 60 * 60 * 1000));

            const { error: promoteError } = await supabase
              .from('boost_slots')
              .insert({
                slot_number: expiredSlot.slot_number,
                project_name: nextProject.project_name,
                project_logo: nextProject.project_logo,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                project_id: nextProject.project_id
              });

            if (promoteError) {
              console.error('Error promoting waitlist project:', promoteError);
              continue;
            }

            // Remove promoted project from waitlist
            const { error: removeError } = await supabase
              .from('boost_waitlist')
              .delete()
              .eq('id', nextProject.id);

            if (removeError) {
              console.error('Error removing promoted project from waitlist:', removeError);
            }
          }
        }
      }

      // Return active slots and waitlist
      return {
        slots: processedSlots.filter(slot => slot.active),
        waitlist: waitlist as WaitlistProject[]
      };
    }
  });
};
