CREATE TABLE IF NOT EXISTS tickets (
   ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
   user_id INTEGER NOT NULL,
   event_id INTEGER NOT NULL,
   confirmation_code TEXT NOT NULL,
   quantity INTEGER NOT NULL,
   created_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000),
   sent_ms INTEGER,
   used_ms INTEGER
);
