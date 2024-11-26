-- Add wallet_address and transaction_signature columns to boost_waitlist
ALTER TABLE boost_waitlist 
ADD COLUMN wallet_address TEXT,
ADD COLUMN transaction_signature TEXT;