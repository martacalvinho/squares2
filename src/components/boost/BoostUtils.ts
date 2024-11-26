import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';

type BoostSlot = Database['public']['Tables']['boost_slots']['Row'];
type WaitlistProject = Database['public']['Tables']['boost_waitlist']['Row'];

// Constants
const HOURS_PER_DOLLAR = 0.2; // $5 = 1 hour
const MAX_BOOST_HOURS = 48;
const MIN_CONTRIBUTION = 5;
const RECIPIENT_WALLET = new PublicKey('5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz4FPeDR1dWySB');

export interface ProjectSubmission {
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string;
  chart_link?: string;
  initial_contribution: number;  // Changed from total_contributions
}

export function calculateBoostDuration(amount: number) {
  const hours = amount * HOURS_PER_DOLLAR;
  const cappedHours = Math.min(hours, MAX_BOOST_HOURS);
  const minutes = (hours - Math.floor(hours)) * 60;

  return {
    hours: Math.floor(cappedHours),
    minutes: Math.round(minutes),
  };
}

export async function processBoostPayment(
  wallet: WalletContextState,
  connection: Connection,
  amountUSD: number,
  solPrice: number
) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  if (!solPrice || solPrice <= 0) {
    throw new Error('Invalid SOL price. Please try again.');
  }

  console.log('Processing payment:', {
    amountUSD,
    solPrice,
    solAmount: amountUSD / solPrice,
  });

  // Convert USD to SOL with proper rounding
  const solAmount = Number((amountUSD / solPrice).toFixed(9)); // 9 decimals for SOL
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  console.log('Calculated amounts:', {
    solAmount,
    lamports,
    LAMPORTS_PER_SOL,
  });

  if (isNaN(lamports) || lamports <= 0) {
    throw new Error(
      `Invalid payment amount. USD: ${amountUSD}, SOL: ${solPrice}, Lamports: ${lamports}`
    );
  }

  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: RECIPIENT_WALLET,
      lamports: BigInt(lamports),
    })
  );

  try {
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send transaction
    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);

    return signature;
  } catch (error) {
    console.error('Payment error:', error);
    throw new Error('Payment failed. Please try again.');
  }
}

export async function submitBoostProject(
  values: ProjectSubmission,
  wallet: WalletContextState,
  connection: Connection,
  solPrice: number
) {
  // Validate minimum contribution
  if (values.initial_contribution < MIN_CONTRIBUTION) {
    throw new Error(`Minimum contribution is $${MIN_CONTRIBUTION}`);
  }

  // Process payment first
  const signature = await processBoostPayment(
    wallet,
    connection,
    values.initial_contribution,
    solPrice
  );

  // Calculate boost duration
  const { hours, minutes } = calculateBoostDuration(values.initial_contribution);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + (hours * 60 + minutes) * 60 * 1000);

  // Check for available slots
  const { data: slots } = await supabase
    .from('boost_slots')
    .select('slot_number')
    .order('slot_number', { ascending: true });

  const usedSlots = new Set(slots?.map((s) => s.slot_number) || []);
  let availableSlot = null;

  // Find first available slot (1-5)
  for (let i = 1; i <= 5; i++) {
    if (!usedSlots.has(i)) {
      availableSlot = i;
      break;
    }
  }

  if (availableSlot) {
    // Add to boost slots
    const { data: newSlot, error: insertError } = await supabase
      .from('boost_slots')
      .insert({
        project_name: values.project_name,
        project_logo: values.project_logo,
        project_link: values.project_link,
        telegram_link: values.telegram_link || null,
        chart_link: values.chart_link || null,
        slot_number: availableSlot,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        initial_contribution: values.initial_contribution
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to create boost slot');
    }
    if (!newSlot) throw new Error('Failed to create boost slot');

    // Add initial contribution record
    const { error: contributionError } = await supabase
      .from('boost_contributions')
      .insert({
        slot_id: newSlot.id,
        wallet_address: wallet.publicKey!.toString(),
        amount: values.initial_contribution,
        transaction_signature: signature
      });

    if (contributionError) {
      console.error('Contribution error:', contributionError);
      throw new Error('Failed to record initial contribution');
    }

    return { type: 'boosted', slot: availableSlot, signature };
  } else {
    // Add to waitlist with transaction details
    const { error } = await supabase
      .from('boost_waitlist')
      .insert({
        project_name: values.project_name,
        project_logo: values.project_logo,
        project_link: values.project_link,
        telegram_link: values.telegram_link || null,
        chart_link: values.chart_link || null,
        contribution_amount: values.initial_contribution,
        wallet_address: wallet.publicKey!.toString(),
        transaction_signature: signature
      });

    if (error) {
      console.error('Waitlist error:', error);
      throw new Error('Failed to add project to waitlist');
    }

    return { type: 'waitlist', signature };
  }
}

export async function assignWaitlistToAvailableSlot(
  waitlistProjects: WaitlistProject[],
  boostSlots: BoostSlot[]
) {
  if (waitlistProjects.length === 0) return;

  // Find first available slot
  const usedSlots = new Set(boostSlots.map((s) => s.slot_number));
  let availableSlot = null;

  for (let i = 1; i <= 5; i++) {
    if (!usedSlots.has(i)) {
      availableSlot = i;
      break;
    }
  }

  if (!availableSlot) return;

  // Get the first project from waitlist
  const projectToAssign = waitlistProjects[0];
  const { hours, minutes } = calculateBoostDuration(
    projectToAssign.contribution_amount
  );

  const startTime = new Date();
  const endTime = new Date(
    startTime.getTime() + (hours * 60 + minutes) * 60 * 1000
  );

  try {
    // Begin transaction
    const { error: insertError } = await supabase
      .from('boost_slots')
      .insert({
        slot_number: availableSlot,
        project_name: projectToAssign.project_name,
        project_logo: projectToAssign.project_logo,
        project_link: projectToAssign.project_link,
        telegram_link: projectToAssign.telegram_link,
        chart_link: projectToAssign.chart_link,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        initial_contribution: projectToAssign.contribution_amount,
      });

    if (insertError) throw insertError;

    // Remove from waitlist
    const { error: deleteError } = await supabase
      .from('boost_waitlist')
      .delete()
      .eq('id', projectToAssign.id);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error assigning waitlist project:', error);
    throw error;
  }
}
