ALTER TABLE events DROP COLUMN event_time;
ALTER TABLE events DROP COLUMN modtime;
ALTER TABLE events DROP COLUMN price;
ALTER TABLE events ADD COLUMN price INT;
ALTER TABLE events ADD COLUMN series VARCHAR(128);
ALTER TABLE events RENAME COLUMN location_display TO venue;
ALTER TABLE events RENAME COLUMN location_address TO venue_address;
ALTER TABLE events RENAME COLUMN calendar_description TO directions;
ALTER TABLE events RENAME COLUMN start_datetime TO start_time;
