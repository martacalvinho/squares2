-- Add hours_added column to boost_contributions
ALTER TABLE boost_contributions ADD COLUMN hours_added DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Update existing records
UPDATE boost_contributions SET hours_added = amount * 0.2;