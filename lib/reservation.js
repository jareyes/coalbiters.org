class Reservation {
  constuctor(reservation_id, event_id, user_id) {
    this.reservation_id = reservation_id;
    this.event_id = event_id;
    this.user_id = user_id;
  }
}

module.exports = Reservation;
