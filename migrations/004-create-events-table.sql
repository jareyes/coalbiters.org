CREATE TABLE IF NOT EXISTS events (
   event_id INTEGER PRIMARY KEY AUTOINCREMENT,
   created_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000),
   directions TEXT,
   end_ms INTEGER NOT NULL,
   location_url TEXT,
   price_cents INTEGER NOT NULL,
   price_stripe_id TEXT,
   slug TEXT NOT NULL,
   start_ms INTEGER NOT NULL,
   summary TEXT,
   title TEXT NOT NULL,
   updated_ms INTEGER,
   venue TEXT,
   venue_address TEXT
);
