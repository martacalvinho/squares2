-- First, let's standardize the wallet_address in boost_contributions to text
ALTER TABLE boost_contributions
    ALTER COLUMN wallet_address TYPE TEXT USING wallet_address::TEXT;

-- Backfill wallet_stats from boost_contributions
INSERT INTO wallet_stats (
    wallet_address,
    first_interaction,
    last_interaction,
    total_boost_contributions,
    total_boost_amount
)
SELECT 
    wallet_address,
    MIN(created_at) as first_interaction,
    MAX(created_at) as last_interaction,
    COUNT(*) as total_boost_contributions,
    SUM(amount) as total_boost_amount
FROM boost_contributions
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
ON CONFLICT (wallet_address) 
DO UPDATE SET
    first_interaction = LEAST(wallet_stats.first_interaction, EXCLUDED.first_interaction),
    last_interaction = GREATEST(wallet_stats.last_interaction, EXCLUDED.last_interaction),
    total_boost_contributions = wallet_stats.total_boost_contributions + EXCLUDED.total_boost_contributions,
    total_boost_amount = wallet_stats.total_boost_amount + EXCLUDED.total_boost_amount;

-- Backfill from spots
INSERT INTO wallet_stats (
    wallet_address,
    first_interaction,
    last_interaction,
    total_spots_owned
)
SELECT 
    wallet_address,
    MIN(created_at) as first_interaction,
    MAX(updated_at) as last_interaction,
    COUNT(*) as total_spots_owned
FROM spots
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
ON CONFLICT (wallet_address) 
DO UPDATE SET
    first_interaction = LEAST(wallet_stats.first_interaction, EXCLUDED.first_interaction),
    last_interaction = GREATEST(wallet_stats.last_interaction, EXCLUDED.last_interaction),
    total_spots_owned = wallet_stats.total_spots_owned + EXCLUDED.total_spots_owned;

-- Backfill from boost_waitlist
INSERT INTO wallet_stats (
    wallet_address,
    first_interaction,
    last_interaction
)
SELECT 
    wallet_address,
    MIN(created_at) as first_interaction,
    MAX(updated_at) as last_interaction
FROM boost_waitlist
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
ON CONFLICT (wallet_address) 
DO UPDATE SET
    first_interaction = LEAST(wallet_stats.first_interaction, EXCLUDED.first_interaction),
    last_interaction = GREATEST(wallet_stats.last_interaction, EXCLUDED.last_interaction);

-- Backfill from comments (using user_id as wallet_address)
INSERT INTO wallet_stats (
    wallet_address,
    first_interaction,
    last_interaction
)
SELECT 
    user_id as wallet_address,
    MIN(created_at) as first_interaction,
    MAX(updated_at) as last_interaction
FROM comments
WHERE user_id IS NOT NULL
GROUP BY user_id
ON CONFLICT (wallet_address) 
DO UPDATE SET
    first_interaction = LEAST(wallet_stats.first_interaction, EXCLUDED.first_interaction),
    last_interaction = GREATEST(wallet_stats.last_interaction, EXCLUDED.last_interaction);

-- Backfill wallet_interactions from boost_contributions
INSERT INTO wallet_interactions (
    wallet_address,
    interaction_type,
    interaction_time,
    amount,
    boost_slot_id,
    transaction_signature
)
SELECT 
    wallet_address::TEXT,
    'boost' as interaction_type,
    created_at as interaction_time,
    amount,
    slot_id as boost_slot_id,
    transaction_signature
FROM boost_contributions
WHERE wallet_address IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill wallet_interactions from spots
INSERT INTO wallet_interactions (
    wallet_address,
    interaction_type,
    interaction_time,
    spot_id
)
SELECT 
    wallet_address,
    'spot_purchase' as interaction_type,
    created_at as interaction_time,
    id as spot_id 
FROM spots
WHERE wallet_address IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill wallet_interactions from boost_waitlist
INSERT INTO wallet_interactions (
    wallet_address,
    interaction_type,
    interaction_time,
    amount,
    additional_data
)
SELECT 
    wallet_address,
    'waitlist_join' as interaction_type,
    created_at as interaction_time,
    contribution_amount as amount,
    jsonb_build_object(
        'project_name', project_name,
        'project_link', project_link
    ) as additional_data
FROM boost_waitlist
WHERE wallet_address IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill wallet_interactions from comments
INSERT INTO wallet_interactions (
    wallet_address,
    interaction_type,
    interaction_time,
    additional_data
)
SELECT 
    user_id as wallet_address,
    'comment' as interaction_type,
    created_at as interaction_time,
    jsonb_build_object('comment_id', id) as additional_data
FROM comments
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;
