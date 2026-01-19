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

exports.get_by_id = get_by_id;
exports.get_by_slug = get_by_slug;
    
