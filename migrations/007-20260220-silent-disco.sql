INSERT INTO events (
   event_id,
   created_ms,
   description,
   directions,
   end_ms,
   icalendar_id,
   latitude,
   longitude,
   price_cents,
   price_stripe_id,
   slug,
   start_ms,
   subtitle,
   title,
   updated_ms,
   venue_name,
   venue_address
) VALUES (
  17,
  1768763555505,
  '<h2>Winter Dance Party!</h2><p>Come fill the winter night with merriment and mirth with friends old and new. Switch back and forth between three simultaneous channel of dance music <em>free of charge</em>.</p>',
  'Public parking is available on Pleasant Street and in the lot behind Daddy''s, accessible via Broad Street',
  1771642800000, -- 2026-02-26T22:00:00-05:00
  '889a513b-773b-418a-8b1e-932a35ade654',
  43.3715053,
  -72.3385251592626,
  0,
  NULL,
  '2026-02-20-silent-disco',
  1771632000000, -- 2026-02-20T19:00:00-05:00
  'Dance Party',
  'Silent Disco',
  1768763555505,
  'Daddy''s Pizza',
  '50 Pleasant Street, Claremont, NH 03743'
);
