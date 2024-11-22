import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

const RECEIVER_WALLET = '3Ncb97FxmDANzc74DzYmmRmnQBpx51wdiRoAPCbLwcDE';
const NETWORK = 'devnet';
const ENDPOINT = 'https://api.devnet.solana.com';

export const sendPayment = async (
  amount: number,
  publicKey: PublicKey | null,
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined
) => {
  if (!publicKey || !signTransaction) {
    throw new WalletNotConnectedError();
  }

  try {
    const connection = new Connection(ENDPOINT, 'confirmed');
    const receiverPublicKey = new PublicKey(RECEIVER_WALLET);
    
    // Create transaction first to calculate fees
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: receiverPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;
    
    // Calculate exact fee
    const fee = await transaction.getEstimatedFee(connection);
    
    // Check balance including fee
    const balance = await connection.getBalance(publicKey);
    const totalRequired = (amount * LAMPORTS_PER_SOL) + fee;
    
    if (balance < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${amount} SOL + ${fee / LAMPORTS_PER_SOL} SOL for fees`);
    }
    
    // Sign and send transaction
    const signed = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    // Wait for confirmation with timeout
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    });

    if (confirmation.value.err) {
      throw new Error('Transaction failed');
    }
    
    return signature;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};