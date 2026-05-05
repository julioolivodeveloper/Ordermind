CREATE TABLE IF NOT EXISTS square_connections (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id  uuid        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id    text        NOT NULL,
  access_token   text        NOT NULL,
  refresh_token  text,
  expires_at     timestamptz,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(restaurant_id)
);

ALTER TABLE square_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own square connection"
  ON square_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete own square connection"
  ON square_connections FOR DELETE
  USING (auth.uid() = user_id);
