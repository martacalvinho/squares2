-- Create or replace the increment function to work with existing boost_stats table
CREATE OR REPLACE FUNCTION increment_boosted_projects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the existing row, incrementing total_projects_boosted
    UPDATE boost_stats 
    SET total_projects_boosted = COALESCE(total_projects_boosted, 0) + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;

    -- If no row exists (shouldn't happen but just in case), create it
    IF NOT FOUND THEN
        INSERT INTO boost_stats (id, total_projects_boosted, last_updated)
        VALUES (1, 1, CURRENT_TIMESTAMP);
    END IF;
END;
$$;
