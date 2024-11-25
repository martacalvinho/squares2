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

-- Create boost_slots table
CREATE TABLE IF NOT EXISTS boost_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
    project_name VARCHAR(255) NOT NULL,
    project_logo VARCHAR(2048) NOT NULL,
    project_link VARCHAR(2048) NOT NULL CHECK (project_link ~ '^https?:\/\/.+'),
    telegram_link VARCHAR(2048) CHECK (telegram_link IS NULL OR telegram_link ~ '^https?:\/\/.+'),
    chart_link VARCHAR(2048) CHECK (chart_link IS NULL OR chart_link ~ '^https?:\/\/.+'),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL CHECK (end_time > start_time),
    total_contributions DECIMAL NOT NULL CHECK (total_contributions >= 5),
    contributor_count INTEGER NOT NULL DEFAULT 1 CHECK (contributor_count >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (slot_number)
);

-- Create boost_waitlist table
CREATE TABLE IF NOT EXISTS boost_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    project_logo VARCHAR(2048) NOT NULL,
    project_link VARCHAR(2048) NOT NULL CHECK (project_link ~ '^https?:\/\/.+'),
    telegram_link VARCHAR(2048) CHECK (telegram_link IS NULL OR telegram_link ~ '^https?:\/\/.+'),
    chart_link VARCHAR(2048) CHECK (chart_link IS NULL OR chart_link ~ '^https?:\/\/.+'),
    contribution_amount DECIMAL NOT NULL CHECK (contribution_amount >= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boost_slots_end_time ON boost_slots(end_time);
CREATE INDEX IF NOT EXISTS idx_boost_waitlist_created_at ON boost_waitlist(created_at);

-- Create trigger for updating boost_slots timestamp
CREATE TRIGGER update_boost_slots_updated_at
    BEFORE UPDATE ON boost_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating boost_waitlist timestamp
CREATE TRIGGER update_boost_waitlist_updated_at
    BEFORE UPDATE ON boost_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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