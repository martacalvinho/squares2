import { useBoostSlots } from '@/hooks/useBoostSlots';
import { Plus, Rocket } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';

export const FeaturedBanner = () => {
  const { data: boostSlots } = useBoostSlots();
  const { connected } = useWallet();
  const featuredProjects = boostSlots?.filter(slot => slot.project && slot.active);

  if (!featuredProjects?.length) return null;

  return (
    <div className="sticky top-[52px] z-40 w-full border-b border-crypto-primary/10 bg-crypto-dark/95 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 py-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 text-crypto-primary shrink-0">
            <Rocket className="w-4 h-4" />
            <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">
              Boosted
            </span>
          </div>
          <div className="flex gap-2">
            {featuredProjects.map((slot) => (
              <Dialog key={slot.project?.id}>
                <DialogTrigger asChild>
                  <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-all shrink-0 border border-crypto-primary/20 hover:border-crypto-primary/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary/50">
                    {slot.project?.logo ? (
                      <img
                        src={slot.project.logo}
                        alt={slot.project.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-crypto-primary/20" />
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-crypto-dark border-crypto-primary/20">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-3">
                      {slot.project?.logo && (
                        <img
                          src={slot.project.logo}
                          alt={slot.project.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      {slot.project?.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {slot.project?.description && (
                      <p className="text-sm text-gray-400">{slot.project.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {slot.project?.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={slot.project.website} target="_blank" rel="noopener noreferrer">
                            Website
                          </a>
                        </Button>
                      )}
                      {slot.project?.twitter && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={slot.project.twitter} target="_blank" rel="noopener noreferrer">
                            Twitter
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <button 
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-all shrink-0 border border-crypto-primary/20 hover:border-crypto-primary/50 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-crypto-primary/50"
                  disabled={!connected}
                >
                  <Plus className="w-4 h-4 text-crypto-primary" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-crypto-dark border-crypto-primary/20">
                <DialogHeader>
                  <DialogTitle>Boost Your Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Connect your wallet and boost your project to get featured at the top of the page.
                  </p>
                  {!connected && (
                    <p className="text-sm text-crypto-primary">
                      Please connect your wallet to boost your project.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};
