import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles } from "lucide-react";

export const MobileHero = () => {
  const { connected, connecting, select } = useWallet();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!connected && !connecting) {
      try {
        await select('phantom');
      } catch (error) {
        toast({
          title: "Connection Error",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="relative px-4 py-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-crypto-primary/10 to-transparent" />

      {/* Content */}
      <div className="relative space-y-6 text-center">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-crypto-primary/10 text-crypto-primary text-sm font-medium">
          <Sparkles className="w-4 h-4 mr-2" />
          500 Exclusive Spots Available
        </div>

        <h1 className="text-4xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-crypto-primary to-crypto-secondary bg-clip-text text-transparent">
            Crypto Squares
          </span>
          <br />
          Auction Platform
        </h1>

        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Secure your spot in the next big crypto project. Claim, bid, and trade spots in a fair and transparent way.
        </p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          {!connected && (
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-crypto-primary to-crypto-secondary hover:opacity-90 transition-opacity"
              onClick={handleConnect}
            >
              Connect Wallet
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => window.open('https://t.me/your-telegram', '_blank')}
          >
            Join Community
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-12">
          <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
            <div className="text-2xl font-bold">24.5K</div>
            <div className="text-sm text-muted-foreground">Community Members</div>
          </div>
          <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
            <div className="text-2xl font-bold">142</div>
            <div className="text-sm text-muted-foreground">Spots Claimed</div>
          </div>
        </div>
      </div>
    </div>
  );
};
