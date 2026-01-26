function convert(row) {
    return {
        event_id: row.event_id,
        created_at: new Date(row.created_ms),
        description: row.description,
        directions: row.directions,
        end: new Date(row.end_ms),
        icalendar_id: row.icalendar_id,
        latitude: row.latitude,
        location_url: row.location_url,
        longitude: row.longitude,
        price_cents: row.price_cents,
        slug: row.slug,
        start: new Date(row.start_ms),
        subtitle: row.subtitle,
        timezone: row.timezone,
        title: row.title,
        updated_at: new Date(row.updated_ms),
        venue_address: row.venue_address,
        venue_name: row.venue_name,
        venue_url: row.venue_url,
    };
};

function create(sqlite, event) {
    const event_id = sqlite.prepare(
        `INSERT INTO events (
           created_ms,
           description,
           directions,
           end_ms,
           icalendar_id,
           latitude,
           location_url,
           longitude,
           price_cents,
           slug,
           start_ms,
           subtitle,
           timezone,
           title,
           updated_ms,
           venue_address,
           venue_name,
           venue_url
         ) VALUES (
           :created_ms,
           :description,
           :directions,
           :end_ms,
           :icalendar_id,
           :latitude,
           :location_url,
           :longitude,
           :price_cents,
           :slug,
           :start_ms,
           :subtitle,
           :timezone,
           :title,
           :updated_ms,
           :venue_address,
           :venue_name,
           :venue_url
         )`,
    ).run(event);
    return get_by_id(sqlite, event_id);
}

function get_by_id(sqlite, event_id) {
    const statement = sqlite.prepare("SELECT * FROM events WHERE event_id=:event_id");
    const row = statement.get({event_id});
    const event = convert(row);
    return event;
}

function get_by_slug(sqlite, slug) {
    const statement = sqlite.prepare("SELECT * FROM events WHERE slug=:slug");
    const row = statement.get({slug});
    const event = convert(row);
    return event;
}

function update(sqlite, event) {
    const event_id = sqlite.prepare(
        `UPDATE events SET
           description = :description,
           directions = :directions,
           end_ms = :end_ms,
           icalendar_id = :icalendar_id,
           latitude = :latitude,
           location_url = :location_url,
           longitude = :longitude,
           price_cents = :price_cents,
           slug = :slug,
           start_ms = :start_ms,
           subtitle = :subtitle,
           timezone = :timezone,
           title = :title,
           updated_ms = :updated_ms,
           venue_address = :venue_address,
           venue_name = :venue_name,
           venue_url = :venue_url
        WHERE event_id = :event_id`,
    ).run(event);
    return get_by_id(sqlite, event_id);
}

exports.create = create;
exports.get_by_id = get_by_id;
exports.get_by_slug = get_by_slug;
exports.update = update;
