const database = require("../database");

class Reservation {
  constructor(reservation_id, user_id, event_id) {
    this.reservation_id = reservation_id;
    this.event_id = event_id;
    this.user_id = user_id;
  }

  async save() {
    const result = await database.query(
      "insert into reservations (user_id, event_id) values (?, ?) on duplicate key update user_id=user_id, event_id=event_id",
      [this.user_id, this.event_id],
    );
    return true;
  }

  static create(user_id, event_id) {
    return new Reservation(undefined, user_id, event_id);
  }
}

module.exports = Reservation;
