import { Grid } from "@/components/Grid";
import { Header } from "@/components/Header";
import { Boost } from "@/components/boost/Boost";
import { MobileBoost } from "@/components/mobile/MobileBoost";
import { MobileGrid } from "@/components/mobile/MobileGrid";
import { Rocket } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { SpotModal } from "@/components/SpotModal";
import { useAccount } from "@/integrations/wallet/use-account";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const { connected } = useWallet();
  const { isConnected } = useAccount();
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);
  const [isBoostDialogOpen, setIsBoostDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleStartBidding = async () => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to start bidding",
        variant: "destructive"
      });
      return;
    }

    // Get all spots
    const { data: spots, error } = await supabase
      .from('spots')
      .select('id, project_name, current_bid')
      .order('id');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch spots",
        variant: "destructive"
      });
      return;
    }

    if (!spots || spots.length === 0) {
      toast({
        title: "Error",
        description: "No spots available in the grid",
        variant: "destructive"
      });
      return;
    }

    // Pick a random spot from all spots
    const randomIndex = Math.floor(Math.random() * spots.length);
    const randomSpot = spots[randomIndex];
    
    // Set the selected spot and open the modal
    setSelectedSpotId(randomSpot.id);
    setIsSpotModalOpen(true);
  };

  const handleCloseSpotModal = () => {
    setSelectedSpotId(null);
    setIsSpotModalOpen(false);
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
    <div className="min-h-screen bg-crypto-background text-white">
      <Header />

      {/* Desktop Hero */}
      <section className="relative overflow-hidden hidden md:block">
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

      {/* Mobile Hero */}
      <section className="relative overflow-hidden block md:hidden">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <h1 className="text-3xl font-bold text-crypto-primary">
              Claim Your Spot
            </h1>
            <p className="text-sm text-gray-400">
              Join 500 exclusive projects on Solana
            </p>
            <Button
              size="lg"
              className="bg-crypto-primary hover:bg-crypto-primary-dark text-white w-full"
              onClick={handleStartBidding}
            >
              <Rocket className="mr-2 h-4 w-4" />
              Start Bidding
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">
        <div className="hidden md:block h-full">
          <Grid />
        </div>
        <div className="block md:hidden">
          <MobileGrid />
        </div>
        {selectedSpotId !== null && isSpotModalOpen && (
          <SpotModal
            spotId={selectedSpotId}
            onClose={handleCloseSpotModal}
            isConnected={connected}
            currentPrice={0}
          />
        )}
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
}