-- Create a function to get unique wallets count from all relevant tables
CREATE OR REPLACE FUNCTION get_unique_wallets_count()
RETURNS integer
LANGUAGE sql
AS $$
    WITH all_wallets AS (
        -- Get wallets from wallet_stats
        SELECT DISTINCT wallet_address FROM wallet_stats
        UNION
        -- Get wallets from boost_contributions (now TEXT)
        SELECT DISTINCT wallet_address::TEXT FROM boost_contributions
        WHERE wallet_address IS NOT NULL
        UNION
        -- Get wallets from spots
        SELECT DISTINCT wallet_address FROM spots
        WHERE wallet_address IS NOT NULL
        UNION
        -- Get wallets from boost_waitlist
        SELECT DISTINCT wallet_address FROM boost_waitlist
        WHERE wallet_address IS NOT NULL
        UNION
        -- Get wallets from comments (user_id)
        SELECT DISTINCT user_id as wallet_address FROM comments
        WHERE user_id IS NOT NULL
    )
    SELECT COUNT(DISTINCT wallet_address) as count
    FROM all_wallets;
$$;
