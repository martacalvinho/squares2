import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useAccount } from "@/integrations/wallet/use-account";
import { Rocket } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { BoostSlotCard } from "./ui/BoostSlotCard";
import { BoostSubmissionForm } from "./ui/BoostSubmissionForm";

interface BoostSlot {
  id: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string;
  chart_link?: string;
  start_time: string;
  end_time: string;
  total_contributions: number;
  contributor_count: number;
}

interface WaitlistProject {
  id: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string;
  chart_link?: string;
}

export const Boost = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectLogo, setProjectLogo] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [chartLink, setChartLink] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: boostSlots } = useQuery({
    queryKey: ["boost-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boost_slots")
        .select("*")
        .order("contributor_count", { ascending: false })
        .order("total_contributions", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as BoostSlot[] || [];
    },
    refetchInterval: 5000,
  });

  const { data: waitlistProjects = [] } = useQuery({
    queryKey: ["boost-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boost_waitlist")
        .select("*")  // Changed from specific fields to all fields
        .order("created_at", { ascending: true });
  
      if (error) throw error;
      return data as WaitlistProject[];
    },
    refetchInterval: 5000,
  });

  const handleSubmit = async (values: FormData) => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find first available slot
      const availableSlotIndex = Array.from({ length: 5 }).findIndex(
        (_, index) => !boostSlots?.find(slot => slot.slot_number === index + 1)
      );

      if (availableSlotIndex !== -1) {
        // If there's an available slot, add directly to boost_slots
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 48); // 48 hours boost duration

        const { error: insertError } = await supabase
          .from("boost_slots")
          .insert({
            project_name: values.project_name,
            project_logo: values.project_logo,
            project_link: values.project_link,
            telegram_link: values.telegram_link,
            chart_link: values.chart_link,
            start_time: new Date().toISOString(),
            end_time: endTime.toISOString(),
            total_contributions: 0,
            contributor_count: 0,
            slot_number: availableSlotIndex + 1
          });

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Project has been added to boost slot",
        });
      } else {
        // If no slots available, add to waitlist
        const { error } = await supabase.from("boost_waitlist").insert([
          {
            project_name: values.project_name,
            project_logo: values.project_logo,
            project_link: values.project_link,
            telegram_link: values.telegram_link,
            chart_link: values.chart_link,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Project has been added to waitlist",
        });
      }

      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit project. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const handleSlotClick = async (index: number) => {
    // If there are projects in waitlist, move the first one to boost_slots
    if (waitlistProjects.length > 0) {
      const projectToBoost = waitlistProjects[0];
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 48); // 48 hours boost duration
  
      try {
        // Start a transaction
        const { error: insertError } = await supabase
          .from("boost_slots")
          .insert({
            project_name: projectToBoost.project_name,
            project_logo: projectToBoost.project_logo,
            project_link: projectToBoost.project_link,
            telegram_link: projectToBoost.telegram_link,
            chart_link: projectToBoost.chart_link,
            start_time: new Date().toISOString(),
            end_time: endTime.toISOString(),
            total_contributions: 0,
            contributor_count: 0,
            slot_number: index + 1
          });
  
        if (insertError) throw insertError;
  
        // Remove from waitlist
        const { error: deleteError } = await supabase
          .from("boost_waitlist")
          .delete()
          .eq("id", projectToBoost.id);
  
        if (deleteError) throw deleteError;
  
        toast({
          title: "Success",
          description: "Project has been moved to boost slot",
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to move project to boost slot",
          variant: "destructive",
        });
      }
    } else {
      // If no projects in waitlist, show submission form
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-4 bg-crypto-dark/10 p-4 rounded-lg border border-crypto-primary/10">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-crypto-primary/80">Featured Projects</h3>
            <p className="text-sm text-gray-400">Buy a premium spot to highlight your project</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Boost Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Project</DialogTitle>
              </DialogHeader>
              <BoostSubmissionForm
                projectName={projectName}
                setProjectName={setProjectName}
                projectLogo={projectLogo}
                setProjectLogo={setProjectLogo}
                projectLink={projectLink}
                setProjectLink={setProjectLink}
                telegramLink={telegramLink}
                setTelegramLink={setTelegramLink}
                chartLink={chartLink}
                setChartLink={setChartLink}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isConnected={isConnected}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <BoostSlotCard
            key={index}
            slot={boostSlots?.[index] || null}
            index={index}
            formatTimeLeft={formatTimeLeft}
            onClick={() => handleSlotClick(index)}
          />
          ))}
        </div>
      </div>

      {waitlistProjects.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-crypto-primary/5">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h4 className="text-sm font-medium text-gray-400">Waitlist</h4>
              <p className="text-xs text-gray-500">
                {waitlistProjects.length} project{waitlistProjects.length !== 1 ? 's' : ''} waiting
              </p>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 10 }).map((_, index) => {
                const project = waitlistProjects[index];
                return (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-crypto-primary/20 to-crypto-dark"
                    title={project?.project_name}
                  >
                    {project ? (
                      <img
                        src={project.project_logo}
                        alt={project.project_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-crypto-primary/20" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};