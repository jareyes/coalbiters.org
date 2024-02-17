const database = require("../ticket");

const INSERT_QUERY = "INSERT INTO tickets (stripe_session_id, user_id, event_id, confirmation_code, quantity) VALUES (?, ?, ?, ?, ?)";

const SELECT_BY_CONFIRMATION_CODE = "SELECT * FROM tickets WHERE confirmation_code=?";

function create(row) {
  const ticket = new Ticket();
  Object.assign(ticket, row);
  return ticket;
}

class Ticket {
  constructor() {}

  static get_by_confirmation_code(confirmation_code) {
    const rows = await database.query(SELECT_BY_CODE, [confirmation_code]);
    if(rows.length < 1) {
      return null;
    }
    const ticket = create(rows[0]);
    return ticket;
  }

  save() {
    const result = await database.query(
      INSERT_QUERY,
      [
        this.stripe_session_id,
        this.user_id,
        this.event_id,
        this.confirmation_code,
        this.quantity,
      ],
   );
    return true;
  }
}

module.exports = Ticket;
