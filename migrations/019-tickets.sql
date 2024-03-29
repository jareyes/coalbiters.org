CREATE TABLE IF NOT EXISTS tickets (
  ticket_id INT NOT NULL AUTO_INCREMENT,
  stripe_session_id VARCHAR(128),
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  confirmation_code VARCHAR(16),
  quantity INT NOT NULL DEFAULT 1,
  date_paid TIMESTAMP,
  date_used TIMESTAMP,
  date_sent TIMESTAMP,
  PRIMARY KEY (ticket_id),
  UNIQUE(confirmation_code)
);
