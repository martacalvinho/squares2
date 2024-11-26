-- Create function to increment total_projects_boosted
CREATE OR REPLACE FUNCTION increment_boosted_projects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO boost_stats (total_projects_boosted)
  VALUES (1)
  ON CONFLICT (id)
  DO UPDATE SET total_projects_boosted = boost_stats.total_projects_boosted + 1
  WHERE boost_stats.id = 1;
END;
$$;
