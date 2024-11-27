import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";
import { useAccount } from "@/integrations/wallet/use-account";
import { useWallet } from '@solana/wallet-adapter-react';
import { sendPayment } from '@/integrations/wallet/transaction';
import { getSolPrice, getMinimumBid, formatSol, formatUsd } from '@/lib/price';
import { formatUrl } from "@/lib/url";
import { SuccessModal } from "../SuccessModal";

interface MobileSpotModalProps {
  spotId: number;
  onClose: () => void;
  isConnected: boolean;
  currentPrice: number;
}

export const MobileSpotModal = ({ spotId, onClose, isConnected, currentPrice }: MobileSpotModalProps) => {
  const { publicKey, signTransaction, connected, connecting, select } = useWallet();
  const [projectName, setProjectName] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [projectLogo, setProjectLogo] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousProjectName, setPreviousProjectName] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const minimumBid = getMinimumBid(currentPrice);
  const purchaseAmount = Number(customPrice) || minimumBid;

  // Ensure wallet is ready
  useEffect(() => {
    if (!connected && !connecting) {
      select('phantom');
    }
  }, [connected, connecting, select]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProjectLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!projectName || !projectLink) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Format the project link
    const formattedProjectLink = formatUrl(projectLink);

    if (purchaseAmount < minimumBid) {
      toast({
        title: "Invalid Bid",
        description: `Minimum bid must be ${formatSol(minimumBid)} SOL ($${formatUsd(minimumBid * (solPrice || 0))})`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Basic URL validation
      try {
        new URL(formattedProjectLink);
        if (projectLogo) new URL(projectLogo);
      } catch {
        throw new Error("Please enter valid URLs");
      }

      const signature = await sendPayment(purchaseAmount);
      await updateDatabase(signature);

      toast({
        title: "Success",
        description: "Payment sent and spot claimed successfully!",
      });

      queryClient.invalidateQueries(['spots']);
      queryClient.invalidateQueries(['activities']);
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      if (error.name === 'WalletNotConnectedError') {
        toast({
          title: "Wallet Error",
          description: "Please reconnect your wallet and try again",
          variant: "destructive",
        });
      } else if (error.message?.includes('insufficient balance')) {
        toast({
          title: "Insufficient Balance",
          description: "Please add more SOL to your wallet",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Transaction failed. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDatabase = async (signature: string) => {
    try {
      // First get the current spot data
      const { data: currentSpot } = await supabase
        .from('spots')
        .select('project_name')
        .eq('id', spotId)
        .single();

      // Store the previous project name if it exists
      setPreviousProjectName(currentSpot?.project_name);

      // Insert into spot history if there was a previous project
      if (currentSpot?.project_name) {
        await supabase
          .from('spot_history')
          .insert({
            spot_id: spotId,
            previous_project_name: currentSpot.project_name,
            project_name: projectName,
            transaction_signature: signature
          });
      }

      // Update the spot
      const { error } = await supabase
        .from('spots')
        .update({
          project_name: projectName,
          project_link: projectLink,
          project_logo: projectLogo,
          current_bid: purchaseAmount,
          wallet_address: publicKey.toString(),
          last_transaction: signature
        })
        .eq('id', spotId);

      if (error) throw error;

      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating database:', error);
      throw error;
    }
  };

  return (
    <>
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-full h-full md:h-auto m-0 p-0 md:p-6 rounded-none md:rounded-lg">
          <div className="sticky top-0 bg-background z-10 px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Claim Spot #{spotId + 1}</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name *</Label>
                <Input
                  placeholder="Enter your project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Project Link *</Label>
                <Input
                  placeholder="www.example.com"
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Project Logo</Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragging ? "border-crypto-primary bg-crypto-primary/10" : "border-crypto-primary/20 hover:border-crypto-primary/40"
                  )}
                  onDragEnter={handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {projectLogo ? (
                    <div className="mt-4">
                      <img
                        src={projectLogo}
                        alt="Logo preview"
                        className="max-h-32 mx-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlus className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        Tap to upload logo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Purchase Amount (SOL)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min={minimumBid}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={`Min: ${formatSol(minimumBid)} SOL`}
                />
                <div className="text-sm text-gray-400">
                  Minimum purchase: {formatSol(minimumBid)} SOL 
                  {solPrice && ` ($${formatUsd(minimumBid * solPrice)})`}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4">
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !connected}
            >
              {isSubmitting ? "Claiming..." : "Claim Spot"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showSuccess && (
        <SuccessModal
          spotId={spotId}
          projectName={projectName}
          previousProjectName={previousProjectName}
          onClose={() => {
            setShowSuccess(false);
            onClose();
          }}
        />
      )}
    </>
  );
};
