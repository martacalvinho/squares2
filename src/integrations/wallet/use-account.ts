import { useWallet } from '@solana/wallet-adapter-react';

export const useAccount = () => {
  const { publicKey, connected } = useWallet();
  
  return {
    address: publicKey?.toBase58() || null,
    isConnected: connected,
  }
}