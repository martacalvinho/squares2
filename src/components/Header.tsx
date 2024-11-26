import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Rules } from './Rules';
import { StatsBar } from './StatsBar';

export const Header = () => {
  return (
    <header className="w-full border-b border-crypto-primary/10 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-light bg-clip-text text-transparent">
          Crypto 500
        </h1>
        <div className="flex items-center gap-4">
          <StatsBar />
          <div className="h-6 w-px bg-crypto-primary/10" /> {/* Divider */}
          <Rules />
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
};