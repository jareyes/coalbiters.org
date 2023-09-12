class Event {
  constuctor(event_id, date, title, description, capacity) {
    this.event_id = event_id;
    this.date = date;
    this.title = title;
    this.description = description;
    this.capacity = capacity;
  }
}

module.exports = Event;
