CREATE TABLE IF NOT EXISTS reservations (
  reservation_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  PRIMARY KEY (reservation_id),
  UNIQUE KEY (user_id, event_id)
);
