-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS wallet_interactions_trigger ON wallet_interactions;
DROP FUNCTION IF EXISTS update_wallet_stats();
DROP TABLE IF EXISTS wallet_stats;
DROP TABLE IF EXISTS wallet_interactions;

-- Create wallet_stats table to track all wallet interactions
CREATE TABLE IF NOT EXISTS wallet_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    first_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_spots_owned INTEGER DEFAULT 0,
    total_spots_stolen INTEGER DEFAULT 0,
    total_spots_lost INTEGER DEFAULT 0,
    total_boost_contributions INTEGER DEFAULT 0,
    total_boost_amount DECIMAL DEFAULT 0,
    total_bids INTEGER DEFAULT 0,
    total_bid_amount DECIMAL DEFAULT 0,
    highest_bid DECIMAL DEFAULT 0,
    total_boosted_projects INTEGER DEFAULT 0,
    longest_spot_hold_time INTEGER DEFAULT 0, -- in seconds
    UNIQUE(wallet_address)
);

-- Create wallet_interactions table to track individual interactions
CREATE TABLE IF NOT EXISTS wallet_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    interaction_type TEXT NOT NULL, -- 'bid', 'boost', 'spot_purchase', 'spot_stolen'
    interaction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL,
    spot_id INTEGER, -- Changed from UUID to INTEGER for spots
    boost_slot_id UUID,
    transaction_signature TEXT,
    additional_data JSONB
);

-- Create function to update wallet_stats
CREATE OR REPLACE FUNCTION update_wallet_stats() RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update wallet stats
    INSERT INTO wallet_stats (wallet_address)
    VALUES (NEW.wallet_address)
    ON CONFLICT (wallet_address) DO UPDATE
    SET last_interaction = NOW();

    -- Update specific stats based on interaction type
    CASE NEW.interaction_type
        WHEN 'bid' THEN
            UPDATE wallet_stats
            SET total_bids = total_bids + 1,
                total_bid_amount = total_bid_amount + NEW.amount,
                highest_bid = GREATEST(highest_bid, NEW.amount)
            WHERE wallet_address = NEW.wallet_address;
            
        WHEN 'boost' THEN
            UPDATE wallet_stats
            SET total_boost_contributions = total_boost_contributions + 1,
                total_boost_amount = total_boost_amount + NEW.amount
            WHERE wallet_address = NEW.wallet_address;
            
        WHEN 'spot_purchase' THEN
            UPDATE wallet_stats
            SET total_spots_owned = total_spots_owned + 1
            WHERE wallet_address = NEW.wallet_address;
            
        WHEN 'spot_stolen' THEN
            -- Update the stats for both the stealer and the victim
            UPDATE wallet_stats
            SET total_spots_stolen = total_spots_stolen + 1,
                total_spots_owned = total_spots_owned + 1
            WHERE wallet_address = NEW.wallet_address;
            
            UPDATE wallet_stats
            SET total_spots_lost = total_spots_lost + 1,
                total_spots_owned = GREATEST(0, total_spots_owned - 1)
            WHERE wallet_address = (NEW.additional_data->>'previous_owner')::TEXT;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wallet_interactions
CREATE TRIGGER wallet_interactions_trigger
    AFTER INSERT ON wallet_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_stats();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS wallet_stats_wallet_address_idx ON wallet_stats(wallet_address);
CREATE INDEX IF NOT EXISTS wallet_interactions_wallet_address_idx ON wallet_interactions(wallet_address);
CREATE INDEX IF NOT EXISTS wallet_interactions_type_idx ON wallet_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS wallet_interactions_time_idx ON wallet_interactions(interaction_time);
