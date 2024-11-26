import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu } from 'lucide-react';
import { Rules } from './Rules';
import { StatsBar } from './StatsBar';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Header = () => {
  return (
    <header className="w-full border-b border-crypto-primary/10 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-light bg-clip-text text-transparent">
          Crypto 500
        </h1>
        <div className="flex items-center gap-4">
          {/* Desktop View */}
          <div className="hidden md:flex items-center gap-4">
            <StatsBar />
            <div className="h-6 w-px bg-crypto-primary/10" />
            <Rules />
          </div>
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Stats</h3>
                    <StatsBar />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Info</h3>
                    <Rules />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
};