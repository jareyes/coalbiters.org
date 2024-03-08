const database = require("../database");
const helpers = require("../helpers");

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

  get display_daterange() {
    return helpers.display_daterange(this.start_time, this.end_time);
  }

  get end_time() {
    const end_time = new Date(this.start_time);
    end_time.setUTCMinutes(
      this.start_time.getUTCMinutes() + this.duration_m,
    );
    return end_time;
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
