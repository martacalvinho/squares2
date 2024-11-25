import { useState } from "react";
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
import { Database } from "@/types/supabase";

interface BoostSlot {
  id: string;
  slot_number: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link: string | null;
  chart_link: string | null;
  start_time: string;
  end_time: string;
  initial_contribution: number;
  created_at: string;
  updated_at: string;
}

interface BoostSlotsProps {
  slots: BoostSlot[];
  onSlotClick?: (slot: BoostSlot | null) => void;
  solPrice: number;
}

function formatTimeLeft(endTime: string) {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "0h 0m";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

export function BoostSlots({ slots, onSlotClick, solPrice }: BoostSlotsProps) {
  const [contributingSlot, setContributingSlot] = useState<BoostSlot | null>(null);
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [contribution, setContribution] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wallet = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  const handleContribute = async (slot: BoostSlot) => {
    if (!wallet.publicKey) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to contribute.",
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

      // Update slot contributions
      const { error } = await supabase
        .from("boost_slots")
        .update({
          initial_contribution: slot.initial_contribution + contribution,
        })
        .eq("slot_number", slot.slot_number);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your contribution has been processed.",
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const slot = slots.find((s) => s.slot_number === index + 1);
          const isAvailable = !slot;
          const isExpanded = expandedSlot === index;

          // Dynamically compute total_contributions and contributor_count
          const totalContributions = slot?.initial_contribution || 0;
          const contributorCount = slot?.initial_contribution > 0 ? 1 : 0;

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
              <div className="absolute top-2 right-2 bg-crypto-dark/40 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {index + 1}
              </div>

              <div className="p-2">
                {isAvailable ? (
                  <div className="text-center py-2">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-crypto-primary/10 flex items-center justify-center">
                      <span className="text-xl text-crypto-primary">+</span>
                    </div>
                    <h3 className="text-xs font-medium text-crypto-primary/80">
                      Available
                    </h3>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-full overflow-hidden mb-1">
                        <img
                          src={slot.project_logo}
                          alt={slot.project_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-xs font-medium text-crypto-primary/80 truncate mb-1">
                        {slot.project_name}
                      </h3>
                      <button
                        className="text-xs text-gray-400 flex items-center justify-center w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSlot(isExpanded ? null : index);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 space-y-2 border-t border-crypto-dark/10 pt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {formatTimeLeft(slot.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {contributorCount} contributor
                            {contributorCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <a
                            href={slot.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded-md bg-crypto-primary/10 hover:bg-crypto-primary/20 text-crypto-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                          {slot.telegram_link && (
                            <a
                              href={slot.telegram_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              TG
                            </a>
                          )}
                          {slot.chart_link && (
                            <a
                              href={slot.chart_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Chart
                            </a>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContributingSlot(slot);
                          }}
                          className="w-full text-xs px-2 py-1 rounded-md bg-crypto-primary text-white hover:bg-crypto-primary/90 transition-colors"
                        >
                          Contribute
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

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
                  Time Added: {Math.floor(contribution * 0.2)}h{" "}
                  {Math.round((contribution * 0.2) % 1 * 60)}m
                </span>
              </div>
              <Input
                type="number"
                min={5}
                step={1}
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum $5 contribution
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setContributingSlot(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  contributingSlot && handleContribute(contributingSlot)
                }
                disabled={isSubmitting || contribution < 5 || !wallet.publicKey}
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