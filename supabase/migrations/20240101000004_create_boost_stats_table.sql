-- Create boost_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS boost_stats (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row
    total_projects_boosted INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row if it doesn't exist
INSERT INTO boost_stats (id, total_projects_boosted)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Update the increment function to be more robust
CREATE OR REPLACE FUNCTION increment_boosted_projects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure the stats row exists
    INSERT INTO boost_stats (id, total_projects_boosted)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING;
    
    -- Increment the counter
    UPDATE boost_stats
    SET total_projects_boosted = total_projects_boosted + 1,
        updated_at = NOW()
    WHERE id = 1;
END;
$$;
