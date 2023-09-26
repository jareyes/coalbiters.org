INSERT INTO events (event_date, title, slug)
  VALUES ("2023-10-03 22:00", "Playdate: Almost, Maine", "2023-10-03-playdate");

INSERT INTO reservations (user_id, event_id)
  SELECT user_id, 1 FROM users;
