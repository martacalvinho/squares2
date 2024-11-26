-- Rename total_contributions to initial_contribution in boost_slots table
ALTER TABLE boost_slots RENAME COLUMN total_contributions TO initial_contribution;