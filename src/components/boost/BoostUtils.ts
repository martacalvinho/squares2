import { WaitlistProject, BoostSlot } from "./BoostTypes";
import { supabase } from "@/integrations/supabase/client";

export function formatTimeLeft(endTime: string) {
  if (!endTime) return "0h";

  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "0h";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

export function calculateBoostDuration(contributionAmount: number) {
  const totalMinutes = (contributionAmount / 5) * 60;
  const hours = Math.min(Math.floor(totalMinutes / 60), 48);
  const minutes = hours >= 48 ? 0 : totalMinutes % 60;
  return { hours, minutes };
}

export async function assignWaitlistToAvailableSlot(waitlistProjects: WaitlistProject[], boostSlots: BoostSlot[]) {
  console.log('Checking for waitlist projects...', { waitlistProjects, boostSlots });
  
  // If no projects in waitlist, nothing to do
  if (waitlistProjects.length === 0) {
    console.log('No projects in waitlist');
    return;
  }

  // Find first available slot (slot with no project)
  const availableSlot = boostSlots.find(slot => !slot.project_name);
  console.log('Available slot:', availableSlot);
  
  if (!availableSlot) {
    console.log('No available slots');
    return;
  }

  // Get the first project from waitlist
  const projectToAssign = waitlistProjects[0];
  console.log('Project to assign:', projectToAssign);

  // Calculate start and end time
  const startTime = new Date().toISOString();
  const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

  try {
    // Begin transaction
    console.log('Updating boost slot:', availableSlot.slot_number);
    const { error: updateError } = await supabase
      .from('boost_slots')
      .update({
        project_name: projectToAssign.project_name,
        project_logo: projectToAssign.project_logo,
        project_link: projectToAssign.project_link,
        telegram_link: projectToAssign.telegram_link,
        chart_link: projectToAssign.chart_link,
        start_time: startTime,
        end_time: endTime,
        total_contributions: projectToAssign.contribution_amount,
        contributor_count: 1
      })
      .eq('slot_number', availableSlot.slot_number);

    if (updateError) {
      console.error('Error updating slot:', updateError);
      throw updateError;
    }

    console.log('Successfully updated slot, removing from waitlist');
    // Remove project from waitlist
    const { error: deleteError } = await supabase
      .from('boost_waitlist')
      .delete()
      .eq('id', projectToAssign.id);

    if (deleteError) {
      console.error('Error deleting from waitlist:', deleteError);
      throw deleteError;
    }

    console.log('Successfully moved project from waitlist to slot');

  } catch (error) {
    console.error('Error assigning waitlist project to slot:', error);
    throw error;
  }
}