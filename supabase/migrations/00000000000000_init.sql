-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create spots table with constraints
CREATE TABLE IF NOT EXISTS spots (
    id INTEGER PRIMARY KEY,
    current_bid DECIMAL CHECK (current_bid >= 0),
    current_bidder VARCHAR(44) CHECK (
        current_bidder IS NULL OR 
        LENGTH(current_bidder) BETWEEN 32 AND 44
    ),
    project_name VARCHAR(255),
    project_link VARCHAR(2048) CHECK (
        project_link IS NULL OR 
        project_link ~ '^https?:\/\/.+'
    ),
    project_logo VARCHAR(2048),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_spots_updated_at
    BEFORE UPDATE ON spots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_spots_current_bid ON spots(current_bid);
CREATE INDEX IF NOT EXISTS idx_spots_updated_at ON spots(updated_at);
CREATE INDEX IF NOT EXISTS idx_spots_current_bidder ON spots(current_bidder);

-- Initialize 500 spots
INSERT INTO spots (id, current_bid, current_bidder, project_name, project_link, project_logo)
SELECT 
    generate_series,
    0,
    NULL,
    NULL,
    NULL,
    NULL
FROM generate_series(0, 499)
ON CONFLICT (id) DO NOTHING;