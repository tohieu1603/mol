-- User Gateway Configuration
-- Allows users to specify their own gateway for AI calls

-- Add gateway fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gateway_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gateway_token TEXT;

-- Index for quick lookup of users with custom gateways
CREATE INDEX IF NOT EXISTS idx_users_gateway ON users(gateway_url) WHERE gateway_url IS NOT NULL;

COMMENT ON COLUMN users.gateway_url IS 'Custom gateway URL for AI calls (e.g., https://gateway.example.com)';
COMMENT ON COLUMN users.gateway_token IS 'Authentication token for the custom gateway';
