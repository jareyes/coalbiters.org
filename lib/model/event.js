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

  get daterange() {
    return helpers.display_daterange(
      this.start_datetime,
      this.duration_m,
    );
  }

  get end_datetime() {
    const end_datetime = new Date(this.start_datetime);
    end_datetime.setUTCMinutes(
      this.start_datetime.getUTCMinutes() + this.duration_m,
    );
    return end_datetime;
  }

  get registration_open() {
    return (Date.now() < this.start_datetime.getTime());
  }

  to_pojo() {
    return Object.assign(
      {},
      this,
      {
        daterange: this.daterange,
        end_datetime: this.end_datetime,
        registration_open: this.registration_open,
      }
    );
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
