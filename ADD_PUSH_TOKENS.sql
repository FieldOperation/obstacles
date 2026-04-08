-- ============================================
-- PUSH TOKENS: Store Expo push tokens for notifications
-- ============================================
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own token
CREATE POLICY "Users can manage own push token"
ON push_tokens FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- WORKER and ADMIN can read push tokens (to send notifications)
CREATE POLICY "Workers and admins can read push tokens"
ON push_tokens FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'WORKER')
  )
);
