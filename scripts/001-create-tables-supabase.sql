-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  certificate_number VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster certificate lookups
CREATE INDEX IF NOT EXISTS idx_participants_certificate_number 
ON participants(certificate_number);

-- Create index for case-insensitive searches
CREATE INDEX IF NOT EXISTS idx_participants_certificate_number_lower 
ON participants(LOWER(certificate_number));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on participants" ON participants
FOR ALL USING (true) WITH CHECK (true);
