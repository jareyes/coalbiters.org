CREATE TABLE IF NOT EXISTS users (
   user_id INTEGER PRIMARY KEY AUTOINCREMENT,
   email TEXT NOT NULL,
   password TEXT,
   created_ms INTEGER DEFAULT (strfttime('%s', 'now') * 1000),
   updated_ms INTEGER
);
