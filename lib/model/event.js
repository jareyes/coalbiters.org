const database = require("../database");

function create(row) {
  const event = new Event();
  Object.assign(event, row);
  return event;
}

class Event {
  constructor() {
    // Use create(row) to add all the fields.
    // Yes, I know. Lazy, less explicit. Bad.
  }

  get end_datetime() {
    const end_datetime = new Date(this.start_datetime);
    end_datetime.setUTCMinutes(
      this.start_datetime.getUTCMinutes() + this.duration_m,
    );
    return end_datetime;
  }

  static async get_by_id(event_id) {
    const rows = await database.query(
      "select * from events where event_id = ?",
      [event_id],
    );
    if(rows.length < 1) {
      throw new Error(`Event ID not found: ${event_id}`);
    }
    return create(rows[0]);
  }

  static async get_by_slug(slug) {
    const rows = await database.query(
      "SELECT * FROM events WHERE slug = ?",
      [slug],
    );
    if(rows.length < 1) {
      throw new Error(`Slug not found: ${slug}`);
    }
    return create(rows[0]);
  }
}

module.exports = Event;
