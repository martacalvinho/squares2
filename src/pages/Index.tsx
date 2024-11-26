import { Grid } from "@/components/Grid";
import { Header } from "@/components/Header";
import { Boost } from "@/components/boost/Boost";
import { MobileDropdown } from "@/components/MobileDropdown";
import { Rocket } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { useBoostSlots } from '@/hooks/useBoostSlots';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const Index = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const [isBoostDialogOpen, setIsBoostDialogOpen] = useState(false);
  const { data: boostData } = useBoostSlots();

  const handleStartBidding = async () => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to start bidding",
        variant: "destructive"
      });
      return;
    }

    // Get all spots to find available ones
    const { data: spots, error } = await supabase
      .from('spots')
      .select('id, project_name')
      .order('id');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available spots",
        variant: "destructive"
      });
      return;
    }

    // Filter available spots (those without a project_name)
    const availableSpots = spots.filter(spot => !spot.project_name).map(spot => spot.id);

    if (availableSpots.length === 0) {
      toast({
        title: "No Spots Available",
        description: "All spots are currently taken. Try bidding on an existing spot.",
        variant: "destructive"
      });
      return;
    }

    // Pick a random available spot
    const randomIndex = Math.floor(Math.random() * availableSpots.length);
    const randomSpot = availableSpots[randomIndex];
    
    window.location.href = `/grid/${randomSpot + 1}`;
  };

  const handleBoostProject = () => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to boost your project",
        variant: "destructive"
      });
      return;
    }

    setIsBoostDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-crypto-dark">
      <Header />
      
      {/* Hero Section with Boosted Projects */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0" />
        <div className="container relative mx-auto py-16 px-4">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            {/* Hero Content */}
            <div className="lg:col-span-3 text-center lg:text-left hero-glow">
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-light bg-clip-text text-transparent mb-6">
                Own Your Spot in Web3 History
              </h1>
              <p className="text-lg lg:text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                Bid on one of 500 exclusive spots to showcase your crypto project. Get featured in our boost section for maximum visibility in the Web3 space.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-crypto-primary to-crypto-light hover:opacity-90 transition-opacity"
                  onClick={handleStartBidding}
                >
                  Start Bidding
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-crypto-primary/20 hover:bg-crypto-primary/5"
                  onClick={handleBoostProject}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Boost Your Project
                </Button>
              </div>
            </div>

            {/* Boosted Projects */}
            <div className="lg:col-span-2">
              <div className="glass-effect rounded-2xl p-6 lg:p-8 backdrop-blur-xl">
                <Boost onOpenBoostDialog={() => setIsBoostDialogOpen(true)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <MobileDropdown />
        <Grid />
      </main>

      {/* Boost Dialog */}
      <Dialog open={isBoostDialogOpen} onOpenChange={setIsBoostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Boost Your Project</DialogTitle>
          </DialogHeader>
          <BoostSubmissionForm onSuccess={() => setIsBoostDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;