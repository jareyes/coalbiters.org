ALTER TABLE events DROP COLUMN end_datetime;
ALTER TABLE events DROP COLUMN location;

ALTER TABLE events ADD COLUMN duration_m INT;
ALTER TABLE events ADD COLUMN location_url VARCHAR(128);
ALTER TABLE events ADD COLUMN summary TEXT;
ALTER TABLE events ADD COLUMN details TEXT;
ALTER TABLE events ADD COLUMN location_display VARCHAR(128);
ALTER TABLE events ADD COLUMN location_address VARCHAR(128);
ALTER TABLE events ADD COLUMN location_url VARCHAR(128);
