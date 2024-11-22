import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";
import { useAccount } from "@/integrations/wallet/use-account";
import { Loader2, ExternalLink, Clock, Users, Rocket, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Card,
  CardContent,
} from "./ui/card";
import { cn } from "@/lib/utils";

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
}

const SubmissionForm = ({
  projectName,
  setProjectName,
  projectLogo,
  setProjectLogo,
  projectLink,
  setProjectLink,
  telegramLink,
  setTelegramLink,
  chartLink,
  setChartLink,
  handleSubmit,
  isSubmitting,
  isConnected,
}: {
  projectName: string;
  setProjectName: (value: string) => void;
  projectLogo: string;
  setProjectLogo: (value: string) => void;
  projectLink: string;
  setProjectLink: (value: string) => void;
  telegramLink: string;
  setTelegramLink: (value: string) => void;
  chartLink: string;
  setChartLink: (value: string) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isConnected: boolean;
}) => (
  <div className="space-y-6">
    <div className="space-y-4 rounded-lg bg-crypto-dark/30 p-4 border border-crypto-primary/20">
      <h4 className="font-medium text-crypto-primary">Boost Rules</h4>
      <ul className="space-y-2 text-sm text-gray-400">
        <li className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-crypto-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Maximum Duration</p>
            <p>Projects can be boosted for up to 48 hours</p>
          </div>
        </li>
        <li className="flex items-start gap-2">
          <Users className="w-4 h-4 text-crypto-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Contribution Rates</p>
            <ul className="space-y-1 mt-1">
              <li>• $5.00 = 1 hour boost time</li>
              <li>• $2.50 = 30 minutes boost time</li>
            </ul>
          </div>
        </li>
        <li className="flex items-start gap-2">
          <Rocket className="w-4 h-4 text-crypto-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Ranking System</p>
            <p>Projects are ranked by number of contributors and total contributions</p>
          </div>
        </li>
      </ul>
    </div>

    <div className="space-y-4">
      <Input
        placeholder="Project Name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        required
      />
      <Input
        placeholder="Logo URL"
        value={projectLogo}
        onChange={(e) => setProjectLogo(e.target.value)}
        required
      />
      <Input
        placeholder="Project URL"
        value={projectLink}
        onChange={(e) => setProjectLink(e.target.value)}
        required
      />
      <Input
        placeholder="Telegram Link (Optional)"
        value={telegramLink}
        onChange={(e) => setTelegramLink(e.target.value)}
      />
      <Input
        placeholder="Chart Link (Optional)"
        value={chartLink}
        onChange={(e) => setChartLink(e.target.value)}
      />
      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={!isConnected || isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Submit Project
      </Button>
    </div>
  </div>
);

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
        .select("id, project_name, project_logo")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as WaitlistProject[];
    },
    refetchInterval: 5000,
  });

  const handleSubmit = async () => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to submit a project",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("boost_waitlist").insert({
        project_name: projectName,
        project_logo: projectLogo,
        project_link: projectLink,
        telegram_link: telegramLink || null,
        chart_link: chartLink || null,
        wallet_address: address,
      });

      if (error) throw error;

      toast({
        title: "Project Submitted",
        description: "Your project has been added to the waitlist",
      });

      // Reset form
      setProjectName("");
      setProjectLogo("");
      setProjectLink("");
      setTelegramLink("");
      setChartLink("");
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Always create placeholder slots
  const slots = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    slot_number: i + 1,
  }));

  // Silently replace placeholders with real data when available
  if (boostSlots && boostSlots.length > 0) {
    slots.splice(0, boostSlots.length, ...boostSlots);
  }

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
                <DialogTitle>Submit Your Project</DialogTitle>
              </DialogHeader>
              <SubmissionForm
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
          {slots.map((slot) => {
            const isPlaceholder = !('project_name' in slot);
            return (
              <Card 
                key={slot.id} 
                className={cn(
                  "bg-crypto-dark/20 border-crypto-primary/10 transition-all duration-200",
                  isPlaceholder && "cursor-pointer hover:bg-crypto-dark/30 hover:border-crypto-primary/20 hover:scale-102"
                )}
                onClick={() => isPlaceholder && setDialogOpen(true)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-crypto-primary/10 to-crypto-dark flex items-center justify-center">
                      {isPlaceholder ? (
                        <Plus className="w-6 h-6 text-crypto-primary/60" />
                      ) : (
                        <img
                          src={slot.project_logo}
                          alt={slot.project_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <h4 className="font-medium truncate mb-1 text-crypto-primary/80">
                        {isPlaceholder ? "Available Slot" : slot.project_name}
                      </h4>
                      {!isPlaceholder && (
                        <a
                          href={slot.project_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-crypto-primary/60 hover:text-crypto-primary/80 inline-flex items-center gap-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 text-center">
                      <div>
                        <Clock className="w-3 h-3 mx-auto mb-1" />
                        {isPlaceholder ? "0h" : slot.end_time}
                      </div>
                      <div>
                        <Users className="w-3 h-3 mx-auto mb-1" />
                        {isPlaceholder ? "0" : slot.contributor_count}
                      </div>
                      <div>
                        <div className="w-3 h-3 mx-auto mb-1">$</div>
                        {isPlaceholder ? "0.00" : slot.total_contributions.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-crypto-primary/5">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h4 className="text-sm font-medium text-gray-400">Waitlist</h4>
            {waitlistProjects.length > 0 && (
              <p className="text-xs text-gray-500">
                {waitlistProjects.length} project{waitlistProjects.length !== 1 ? 's' : ''} waiting
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {/* Fixed 10 slots for waitlist */}
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
    </div>
  );
};