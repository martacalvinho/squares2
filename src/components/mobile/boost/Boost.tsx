import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BoostSubmissionForm } from "./BoostSubmissionForm";
import { formatSol } from "@/lib/price";
import { Loader2 } from "lucide-react";

interface BoostSlot {
  id: number;
  project_name: string | null;
  project_link: string | null;
  project_logo: string | null;
  telegram_link: string | null;
  chart_link: string | null;
  current_bid: number;
  wallet_address: string | null;
}

export const MobileBoost = () => {
  const [slots, setSlots] = useState<BoostSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const { connected } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('boost_slots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boost_slots' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('boost_slots')
        .select('*')
        .order('id');

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error fetching boost slots:', error);
      toast({
        title: "Error",
        description: "Failed to load boost slots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slotId: number) => {
    if (!connected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to claim a boost slot.",
        variant: "destructive",
      });
      return;
    }
    setSelectedSlot(slotId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-crypto-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Boost Your Project</h1>
        <p className="text-muted-foreground">
          Get featured in our boost slots for maximum visibility
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {slots.map((slot) => (
          <Card 
            key={slot.id}
            className={cn(
              "transition-all",
              !slot.project_name && "hover:border-crypto-primary cursor-pointer"
            )}
            onClick={() => !slot.project_name && handleSlotClick(slot.id)}
          >
            <CardHeader>
              <CardTitle>Boost Slot #{slot.id}</CardTitle>
              <CardDescription>
                {slot.project_name ? "Currently occupied" : "Available for claiming"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slot.project_name ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {slot.project_logo && (
                      <img
                        src={slot.project_logo}
                        alt={`${slot.project_name} logo`}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{slot.project_name}</h3>
                      <a
                        href={slot.project_link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Visit Project
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {slot.telegram_link && (
                      <a
                        href={slot.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Telegram
                      </a>
                    )}
                    {slot.chart_link && (
                      <a
                        href={slot.chart_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Chart
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Minimum bid: {formatSol(0.1)} SOL
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Current bid: {formatSol(slot.current_bid)} SOL
                </span>
                {!slot.project_name && (
                  <Button
                    variant="outline"
                    onClick={() => handleSlotClick(slot.id)}
                    disabled={!connected}
                  >
                    Claim Slot
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedSlot !== null && (
        <BoostSubmissionForm
          slotId={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          currentPrice={slots[selectedSlot - 1]?.current_bid || 0}
        />
      )}
    </div>
  );
};
