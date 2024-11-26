import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ExternalLink,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";
import { processBoostPayment } from "./BoostUtils";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type BoostSlot = Database['public']['Tables']['boost_slots']['Row'] & {
  total_contributions?: number;
  contributor_count?: number;
  total_hours?: number;
};

interface BoostSlotsProps {
  slots: BoostSlot[];
  onSlotClick?: (slot: BoostSlot | null) => void;
  solPrice: number;
}

function formatTimeLeft(endTime: string) {
  try {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "0h 0m";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return "Invalid time";
  }
}

function isSlotExpired(endTime: string) {
  try {
    const end = new Date(endTime);
    const now = new Date();
    return end.getTime() <= now.getTime();
  } catch (error) {
    console.error('Error checking slot expiry:', error);
    return false;
  }
}

export function BoostSlots({ slots, onSlotClick, solPrice }: BoostSlotsProps) {
  const [contributingSlot, setContributingSlot] = useState<BoostSlot | null>(null);
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [contribution, setContribution] = useState(0.05);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotsWithStats, setSlotsWithStats] = useState<BoostSlot[]>(slots);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const wallet = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  // Update countdown timer every minute
  useEffect(() => {
    const updateTimers = () => {
      const newTimeLeft: { [key: string]: string } = {};
      slotsWithStats.forEach(slot => {
        newTimeLeft[slot.id] = formatTimeLeft(slot.end_time);
      });
      setTimeLeft(newTimeLeft);
    };

    // Update immediately
    updateTimers();

    // Then update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [slotsWithStats]);

  // Fetch contribution stats for all slots
  const fetchContributionStats = async () => {
    const updatedSlots = await Promise.all(
      slots.map(async (slot) => {
        const { data: contributions, error } = await supabase
          .from('boost_contributions')
          .select('amount')
          .eq('slot_id', slot.id);

        if (error) {
          console.error('Error fetching contributions:', error);
          return slot;
        }

        const totalContributions = (contributions || []).reduce(
          (sum, c) => sum + (c.amount || 0),
          slot.initial_contribution
        );

        const totalHours = (contributions || []).reduce(
          (sum, c) => sum + ((c.amount || 0) * 20), // 0.05 SOL = 1 hour
          slot.initial_contribution * 20 // Include initial contribution hours
        );

        const contributorCount = (contributions || []).length + 1; // +1 for initial contributor

        return {
          ...slot,
          total_contributions: totalContributions,
          contributor_count: contributorCount,
          total_hours: totalHours,
        };
      })
    );

    setSlotsWithStats(updatedSlots);
  };

  // Fetch stats on mount and after each contribution
  useEffect(() => {
    fetchContributionStats();
  }, [slots]);

  // Function to update boost stats
  const updateBoostStats = async (projectName: string, contributionAmount: number) => {
    try {
      // Check if this project has been boosted before
      const { data: existingProject } = await supabase
        .from('boost_slots')
        .select('project_name')
        .eq('project_name', projectName)
        .not('end_time', 'is', null)
        .limit(1);

      // Get current stats
      const { data: currentStats, error: statsError } = await supabase
        .from('boost_stats')
        .select('*')
        .single();

      if (statsError) {
        console.error('Error fetching boost stats:', statsError);
        return;
      }

      // Update stats
      const { error: updateError } = await supabase
        .from('boost_stats')
        .update({
          // Only increment total_projects_boosted if this is a new project
          total_projects_boosted: !existingProject?.length 
            ? (currentStats?.total_projects_boosted || 0) + 1 
            : currentStats?.total_projects_boosted || 0,
          total_sol_contributed: (currentStats?.total_sol_contributed || 0) + contributionAmount,
          last_updated: new Date().toISOString()
        })
        .eq('id', currentStats.id);

      if (updateError) {
        console.error('Error updating boost stats:', updateError);
      } else {
        console.log('Successfully updated boost stats for project:', projectName, {
          isNewProject: !existingProject?.length,
          contribution: contributionAmount
        });
      }
    } catch (error) {
      console.error('Error in updateBoostStats:', error);
    }
  };

  // Check for expired slots and promote waitlist
  useEffect(() => {
    const checkExpiredSlots = async () => {
      try {
        const now = new Date().toISOString();
        
        // Get all current slots
        const currentSlots = slotsWithStats.map(slot => ({
          slot: slot.slot_number,
          project: slot.project_name,
          end: slot.end_time,
          expired: new Date(slot.end_time) < new Date()
        }));

        console.log('All current slots:', currentSlots);

        // Find expired slots
        const expiredSlots = currentSlots.filter(slot => slot.expired);
        
        if (expiredSlots.length === 0) {
          console.log('No expired slots found');
          return;
        }

        console.log('Found expired slots:', expiredSlots);

        // Get slots that need to shift up
        const { data: slotsToShift } = await supabase
          .from('boost_slots')
          .select('*')
          .gt('slot_number', expiredSlots[0].slot)
          .order('slot_number', { ascending: true });

        if (!slotsToShift?.length) {
          console.log('No slots to shift');
        } else {
          console.log('Slots to shift:', slotsToShift);
        }

        // Delete expired slot
        const { error: deleteError } = await supabase
          .from('boost_slots')
          .delete()
          .eq('slot_number', expiredSlots[0].slot);

        if (deleteError) {
          console.error('Error deleting expired slot:', deleteError);
          return;
        }

        // Shift remaining slots up
        if (slotsToShift?.length) {
          for (const slot of slotsToShift) {
            const { error: shiftError } = await supabase
              .from('boost_slots')
              .update({ slot_number: slot.slot_number - 1 })
              .eq('id', slot.id);

            if (shiftError) {
              console.error('Error shifting slot:', shiftError);
            }
          }
        }

        // Check waitlist for new project
        const { data: waitlistProjects, error: waitlistError } = await supabase
          .from('boost_waitlist')
          .select('*')
          .order('created_at', { ascending: true });

        if (waitlistError) {
          console.error('Error fetching waitlist:', waitlistError);
          return;
        }

        if (!waitlistProjects?.length) {
          console.log('No projects in waitlist');
          return;
        }

        console.log('Found waitlist projects:', waitlistProjects.map(p => p.project_name));

        // Process each waitlist project
        for (const nextProject of waitlistProjects) {
          try {
            console.log('Promoting project from waitlist:', {
              project: nextProject.project_name,
              contribution: nextProject.contribution_amount,
              created_at: nextProject.created_at,
              id: nextProject.id
            });

            const startTime = new Date();
            const hoursToAdd = nextProject.contribution_amount * 20; // 0.05 SOL = 1 hour
            const endTime = new Date(startTime.getTime() + (hoursToAdd * 60 * 60 * 1000));

            // Calculate the last slot number (should be 5 or less)
            const maxCurrentSlot = Math.min(
              Math.max(...(slotsToShift?.map(s => s.slot_number - 1) || [0]), 0),
              4
            );
            const lastSlotNumber = Math.min(maxCurrentSlot + 1, 5);

            // Create new slot with waitlist project
            const { data: newSlot, error: insertError } = await supabase
              .from('boost_slots')
              .insert({
                slot_number: lastSlotNumber,
                project_name: nextProject.project_name,
                project_logo: nextProject.project_logo,
                project_link: nextProject.project_link,
                telegram_link: nextProject.telegram_link,
                chart_link: nextProject.chart_link,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                initial_contribution: nextProject.contribution_amount
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating new slot from waitlist:', insertError);
              continue;
            }

            // Update boost stats
            await updateBoostStats(nextProject.project_name, nextProject.contribution_amount);

            // Remove from waitlist
            const { error: removeError } = await supabase
              .from('boost_waitlist')
              .delete()
              .eq('id', nextProject.id);

            if (removeError) {
              console.error('Error removing project from waitlist:', removeError);
            } else {
              console.log(`Successfully removed ${nextProject.project_name} from waitlist`);
            }

            // Add initial contribution
            const { error: contributionError } = await supabase
              .from('boost_contributions')
              .insert({
                slot_id: newSlot.id,
                wallet_address: nextProject.wallet_address || 'WAITLIST',
                amount: nextProject.contribution_amount,
                transaction_signature: nextProject.transaction_signature || 'WAITLIST'
              });

            if (contributionError) {
              console.error('Error adding contribution:', contributionError);
              continue;
            }

            // Record wallet interaction
            const { error: interactionError } = await supabase
              .from('wallet_interactions')
              .insert({
                wallet_address: nextProject.wallet_address,
                interaction_type: 'boost',
                amount: nextProject.contribution_amount,
                boost_slot_id: newSlot.id,
                transaction_signature: nextProject.transaction_signature,
                additional_data: {
                  hours_added: hoursToAdd,
                  project_name: nextProject.project_name,
                  promoted_from_waitlist: true,
                  slot_number: lastSlotNumber
                }
              });

            if (interactionError) {
              console.error('Error recording wallet interaction:', interactionError);
            }

            // Notify about the promotion
            toast({
              title: 'Projects Shifted',
              description: `All projects have moved up one slot, and ${nextProject.project_name} has been promoted from the waitlist to slot ${lastSlotNumber}.`,
            });
          } catch (error) {
            console.error('Error processing waitlist project:', error);
          }
        }
      } catch (error) {
        console.error('Error in checkExpiredSlots:', error);
      }
    };

    // Set up interval to check for expired slots
    const interval = setInterval(checkExpiredSlots, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [slotsWithStats]);

  // Function to organize slots by remaining time
  const organizeSlotsByTime = async () => {
    try {
      console.log('Organizing slots by remaining time...');
      
      // Get all active slots
      const { data: activeSlots, error: slotsError } = await supabase
        .from('boost_slots')
        .select('*')
        .gt('end_time', new Date().toISOString())
        .not('project_name', 'is', null);

      if (slotsError) {
        console.error('Error fetching active slots:', slotsError);
        return;
      }

      if (!activeSlots?.length) {
        console.log('No active slots to organize');
        return;
      }

      // Sort slots by remaining time (descending)
      const sortedSlots = activeSlots.sort((a, b) => {
        const timeA = new Date(a.end_time).getTime() - new Date().getTime();
        const timeB = new Date(b.end_time).getTime() - new Date().getTime();
        return timeB - timeA;
      });

      console.log('Slots sorted by remaining time:', sortedSlots.map(s => ({
        project: s.project_name,
        remainingMs: new Date(s.end_time).getTime() - new Date().getTime(),
        currentSlot: s.slot_number
      })));

      // Reassign slot numbers based on remaining time
      for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];
        const newSlotNumber = i + 1;
        
        if (slot.slot_number !== newSlotNumber) {
          console.log(`Moving ${slot.project_name} from slot ${slot.slot_number} to ${newSlotNumber}`);
          
          const { error: updateError } = await supabase
            .from('boost_slots')
            .update({ slot_number: newSlotNumber })
            .eq('id', slot.id);

          if (updateError) {
            console.error('Error updating slot number:', updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error organizing slots:', error);
    }
  };

  // Function to check for and fill empty slots
  const checkAndFillEmptySlots = async () => {
    try {
      console.log('Checking for empty slots...');
      
      // Get all current slot numbers
      const { data: activeSlots, error: slotsError } = await supabase
        .from('boost_slots')
        .select('slot_number')
        .not('project_name', 'is', null);

      if (slotsError) {
        console.error('Error fetching active slots:', slotsError);
        return;
      }

      const occupiedSlots = new Set(activeSlots?.map(s => s.slot_number) || []);
      const emptySlots = [];
      
      // Find empty slots (1-5)
      for (let i = 1; i <= 5; i++) {
        if (!occupiedSlots.has(i)) {
          emptySlots.push(i);
        }
      }

      console.log('Empty slots found:', emptySlots);

      if (emptySlots.length === 0) {
        console.log('No empty slots available');
        return;
      }

      // Get projects from waitlist
      const { data: waitlistProjects, error: waitlistError } = await supabase
        .from('boost_waitlist')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(emptySlots.length);

      if (waitlistError) {
        console.error('Error fetching waitlist:', waitlistError);
        return;
      }

      if (!waitlistProjects?.length) {
        console.log('No projects in waitlist to fill empty slots');
        return;
      }

      console.log('Found waitlist projects:', waitlistProjects.map(p => p.project_name));

      // Fill empty slots with waitlist projects
      for (let i = 0; i < Math.min(emptySlots.length, waitlistProjects.length); i++) {
        const slotNumber = emptySlots[i];
        const project = waitlistProjects[i];
        
        // Convert contribution amount to number and ensure it's at least 0.05
        const contributionAmount = Math.max(Number(project.contribution_amount) || 0.05, 0.05);
        
        console.log(`Filling slot ${slotNumber} with ${project.project_name} (contribution: ${contributionAmount} SOL)`);

        const startTime = new Date();
        const hoursToAdd = contributionAmount * 20; // 0.05 SOL = 1 hour
        const endTime = new Date(startTime.getTime() + (hoursToAdd * 60 * 60 * 1000));

        // Create new slot
        const { data: newSlot, error: insertError } = await supabase
          .from('boost_slots')
          .insert({
            slot_number: slotNumber,
            project_name: project.project_name,
            project_logo: project.project_logo,
            project_link: project.project_link,
            telegram_link: project.telegram_link,
            chart_link: project.chart_link,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            initial_contribution: contributionAmount
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating new slot from waitlist:', insertError);
          console.log('Failed project details:', {
            name: project.project_name,
            contribution: contributionAmount,
            slot: slotNumber
          });
          continue;
        }

        // Update boost stats
        await updateBoostStats(project.project_name, contributionAmount);

        // Add initial contribution
        const { error: contributionError } = await supabase
          .from('boost_contributions')
          .insert({
            slot_id: newSlot.id,
            wallet_address: project.wallet_address || 'WAITLIST',
            amount: contributionAmount,
            transaction_signature: project.transaction_signature || 'WAITLIST'
          });

        if (contributionError) {
          console.error('Error adding contribution:', contributionError);
          continue;
        }

        // Remove from waitlist
        console.log(`Attempting to remove ${project.project_name} from waitlist (ID: ${project.id})...`);
        
        const { error: removeError } = await supabase
          .from('boost_waitlist')
          .delete()
          .eq('id', project.id);

        if (removeError) {
          console.error('Error removing project from waitlist:', removeError);
        } else {
          console.log(`Successfully removed ${project.project_name} from waitlist`);
        }

        // Verify removal
        const { data: verifyWaitlist } = await supabase
          .from('boost_waitlist')
          .select('*')
          .eq('id', project.id)
          .single();

        if (verifyWaitlist) {
          console.error('Project still exists in waitlist after deletion attempt');
          // Try one more time with a different approach
          const { error: retryError } = await supabase
            .from('boost_waitlist')
            .delete()
            .eq('project_name', project.project_name)
            .eq('wallet_address', project.wallet_address);
            
          if (retryError) {
            console.error('Second attempt to remove from waitlist also failed:', retryError);
            toast({
              title: 'Warning',
              description: `Project promoted but may still appear in waitlist. Please refresh.`,
              duration: 5000,
            });
          }
        } else {
          console.log('Verified: Project no longer in waitlist');
        }

        // Record wallet interaction
        const { error: interactionError } = await supabase
          .from('wallet_interactions')
          .insert({
            wallet_address: project.wallet_address,
            interaction_type: 'boost',
            amount: contributionAmount,
            boost_slot_id: newSlot.id,
            transaction_signature: project.transaction_signature,
            additional_data: {
              hours_added: hoursToAdd,
              project_name: project.project_name,
              promoted_from_waitlist: true,
              slot_number: slotNumber
            }
          });

        if (interactionError) {
          console.error('Error recording wallet interaction:', interactionError);
        }

        toast({
          title: 'Project Promoted',
          description: `${project.project_name} has been promoted from the waitlist to slot ${slotNumber}.`,
        });
      }
    } catch (error) {
      console.error('Error filling empty slots:', error);
    }
  };

  // Run organization and empty slot check periodically
  useEffect(() => {
    const checkAndOrganize = async () => {
      await organizeSlotsByTime();
      await checkAndFillEmptySlots();
    };

    // Run immediately and then every 30 seconds
    checkAndOrganize();
    const interval = setInterval(checkAndOrganize, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleContribute = async (slot: BoostSlot) => {
    if (!wallet.publicKey) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to contribute.",
        variant: "destructive",
      });
      return;
    }

    // Calculate hours that would be added
    const hoursToAdd = contribution * 20; // 0.05 SOL = 1 hour
    const currentTotalHours = slot.total_hours || 0;
    const wouldExceedLimit = currentTotalHours + hoursToAdd > 48;

    if (wouldExceedLimit) {
      const remainingHours = 48 - currentTotalHours;
      const maxContribution = Math.floor(remainingHours / 20); // Convert hours back to dollars
      toast({
        title: "Maximum Time Limit",
        description: `This slot can only accept $${maxContribution} more (${remainingHours.toFixed(1)} hours). Please adjust your contribution.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Process payment first
      const signature = await processBoostPayment(
        wallet,
        connection,
        contribution,
        solPrice
      );

      // Calculate new end time
      const currentEndTime = new Date(slot.end_time);
      const newEndTime = new Date(currentEndTime.getTime() + (hoursToAdd * 60 * 60 * 1000)); // Add milliseconds

      // Update the slot's end time
      const { error: slotError } = await supabase
        .from('boost_slots')
        .update({
          end_time: newEndTime.toISOString()
        })
        .eq('id', slot.id);

      if (slotError) throw slotError;

      // Add contribution record
      const { error: contributionError } = await supabase
        .from('boost_contributions')
        .insert({
          slot_id: slot.id,
          wallet_address: wallet.publicKey.toString(),
          amount: contribution,
          transaction_signature: signature
        });

      if (contributionError) throw contributionError;

      // Update boost stats for additional contributions
      await updateBoostStats(slot.project_name, contribution);

      // Record wallet interaction
      const { error: interactionError } = await supabase
        .from('wallet_interactions')
        .insert({
          wallet_address: wallet.publicKey.toString(),
          interaction_type: 'boost',
          amount: contribution,
          boost_slot_id: slot.id,
          transaction_signature: signature,
          additional_data: {
            hours_added: hoursToAdd,
            project_name: slot.project_name
          }
        });

      if (interactionError) {
        console.error('Error recording wallet interaction:', interactionError);
      }

      // Refresh contribution stats
      await fetchContributionStats();

      toast({
        title: "Success!",
        description: `Your contribution added ${hoursToAdd.toFixed(1)} hours to the feature time. New end time: ${formatTimeLeft(newEndTime.toISOString())}`,
      });

      setContributingSlot(null);
    } catch (error) {
      console.error("Error contributing:", error);
      toast({
        title: "Error",
        description: "Failed to process contribution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const slot = slotsWithStats.find((s) => s.slot_number === index + 1);
          const isAvailable = !slot;
          const isExpanded = expandedSlot === index;

          return (
            <Card
              key={index}
              className={`relative overflow-hidden transition-all duration-200 ${
                isAvailable
                  ? "cursor-pointer hover:scale-105 hover:shadow-lg bg-crypto-dark/20"
                  : "cursor-pointer bg-crypto-dark/10 hover:bg-crypto-dark/20"
              }`}
              onClick={() => {
                if (isAvailable) {
                  onSlotClick?.(null);
                } else {
                  setExpandedSlot(isExpanded ? null : index);
                }
              }}
            >
              <div className="p-1.5">
                {isAvailable ? (
                  <div className="text-center py-1">
                    <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-crypto-primary/10 flex items-center justify-center">
                      <span className="text-lg text-crypto-primary">+</span>
                    </div>
                    <h3 className="text-[10px] font-medium text-crypto-primary/80">
                      Available
                    </h3>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto rounded-full overflow-hidden mb-1">
                        <img
                          src={slot.project_logo}
                          alt={slot.project_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-[10px] font-medium text-crypto-primary/80 truncate mb-0.5">
                        {slot.project_name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-0.5" />
                          {timeLeft[slot.id]}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-0.5" />
                          {slot.contributor_count || 1}
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      <button
                        className="mt-1 p-0.5 text-gray-400 hover:text-gray-300 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSlot(isExpanded ? null : index);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-1 space-y-1 border-t border-crypto-dark/10 pt-1">
                          <div className="grid grid-cols-2 gap-1">
                            {slot.chart_link && (
                              <a
                                href={slot.chart_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-crypto-primary bg-crypto-primary/5 rounded px-2 py-1 flex items-center justify-center gap-1 hover:bg-crypto-primary/10 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Chart
                                <ExternalLink className="w-2 h-2" />
                              </a>
                            )}
                            <a
                              href={slot.project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-crypto-primary bg-crypto-primary/5 rounded px-2 py-1 flex items-center justify-center gap-1 hover:bg-crypto-primary/10 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Website
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          </div>
                          {slot.telegram_link && (
                            <a
                              href={slot.telegram_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-crypto-primary bg-crypto-primary/5 rounded px-2 py-1 flex items-center justify-center gap-1 hover:bg-crypto-primary/10 transition-colors w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Telegram
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          )}
                          <button
                            className="w-full text-[10px] bg-crypto-primary text-white py-1 px-2 rounded hover:bg-crypto-primary/90 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContributingSlot(slot);
                            }}
                          >
                            Contribute
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Contribution Dialog */}
      <Dialog open={!!contributingSlot} onOpenChange={() => setContributingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Contribute to {contributingSlot?.project_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Contribution Amount (USD)</span>
                <span>
                  Time Added: {(contribution * 20).toFixed(1)}h
                </span>
              </div>
              <Input
                type="number"
                min={0.05}
                step={0.05}
                value={contribution}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const hours = value * 20; // 0.05 SOL = 1 hour
                  if (
                    contributingSlot &&
                    (contributingSlot.total_hours || 0) + hours > 48
                  ) {
                    toast.error(
                      "This contribution would exceed the 48-hour limit for this slot"
                    );
                    return;
                  }
                  setContribution(value);
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Minimum 0.05 SOL contribution (~$10)</span>
                <span>
                  {contributingSlot && 
                    `${(48 - (contributingSlot.total_hours || 0)).toFixed(1)} hours remaining`
                  }
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setContributingSlot(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  contributingSlot && handleContribute(contributingSlot)
                }
                disabled={isSubmitting || contribution < 0.05 || !wallet.publicKey}
                className="w-full"
              >
                {isSubmitting
                  ? "Contributing..."
                  : wallet.publicKey
                  ? "Contribute"
                  : "Connect Wallet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}