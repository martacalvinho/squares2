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
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-light bg-clip-text text-transparent">
          Crypto 500
        </h1>

        {/* Desktop View */}
        <div className="hidden md:flex items-center gap-6">
          <StatsBar />
          <div className="h-8 w-px bg-crypto-primary/10" />
          <div className="flex items-center gap-3">
            <Rules variant="header" />
            <div className="wallet-button-wrapper">
              <WalletMultiButton />
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-crypto-primary hover:text-crypto-light">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Stats</h3>
                  <StatsBar variant="mobile" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Info</h3>
                  <Rules />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="wallet-button-wrapper">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
};