const database = require("./database");

function create({event_id, event_date, title, slug}) {
  return new Event(event_id, event_date, title, slug);
}

class Event {
  constructor(event_id, date, title, slug) {
    this.event_id = event_id;
    this.date = date;
    this.title = title;
    this.slug = slug;
  }

  static async get_by_id(event_id) {
    const rows = await database.query(
      "select * from events where event_id = ?",
      [event_id],
    );
    if(rows.length < 1) {
      return null;
    }
    return create(rows[0]);
  }
}

module.exports = Event;
