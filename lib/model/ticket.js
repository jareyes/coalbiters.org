const config = require("config");
const crypto = require("node:crypto");
const database = require("../database");
const math = require("../math");

// No I or O because they can look like 1 and 0.
const CONFIRMATION_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROUTES = config.get("routes");
const TICKETS_SALT = config.get("tickets.salt");

const INSERT_QUERY = "INSERT INTO tickets (stripe_session_id, user_id, event_id, confirmation_code, quantity) VALUES (?, ?, ?, ?, ?)";
const PUNCH_QUERY = "UPDATE tickets SET time_used=NOW() WHERE ticket_id=?";
const SELECT_BY_CONFIRMATION_CODE = "SELECT * FROM tickets WHERE confirmation_code=?";

function create(row) {
  const ticket = new Ticket();
  Object.assign(ticket, row);
  return ticket;
}

class Ticket {
  constructor() {}

  get url() {
    const {protocol, host} = ROUTES;
    const mount = ROUTES.mount.tickets;
    const token = Ticket.generate_validation_token(this.confirmation_code);
    // Mounts start with a slash
    return `${protocol}://${host}${mount}/${this.confirmation_code}?token=${token}`;
  }

  get checkin_url() {
    const {protocol, host} = ROUTES;
    const mount = ROUTES.mount.tickets;
    const token = Ticket.generate_validation_token(this.confirmation_code);
    // Mounts start with a slash
    return `${protocol}://${host}${mount}/check-in/${this.confirmation_code}`;
  }

  async save() {
    await database.query(
      INSERT_QUERY,
      [
        this.stripe_session_id,
        this.user_id,
        this.event_id,
        this.confirmation_code,
        this.quantity,
        this.date_paid,
      ],
   );
    return true;
  }

  /* async */ punch() {
    return database.query(PUNCH_QUERY, [this.ticket_id]);
  }

  static generate_confirmation() {
    const digits = new Array(7);
    for(let i = 0 ; i < 5; i++) {
      digits[i] = math.choose(CONFIRMATION_LETTERS);
    }
    for(let i = 5; i < 7; i++) {
      digits[i] = math.choose("012345689");
    }
    const code = digits.join("");
    // FIXME: Check that confirmation is unique
    return code;
  }

  static generate_validation_token(confirmation_code, salt=TICKETS_SALT) {
    const hmac = crypto.createHmac("sha256", salt);
    hmac.update(confirmation_code);
    const digest = hmac.digest("hex");
    return digest.slice(0, 6);
  }

  static is_valid(confirmation_code, validation_token) {
    const candidate = Ticket.generate_validation_token(confirmation_code);
    return (validation_token === candidate);
  }

  static async get_by_confirmation_code(confirmation_code) {
    const rows = await database.query(
      SELECT_BY_CONFIRMATION_CODE,
      [confirmation_code],
    );
    if(rows.length < 1) {
      return null;
    }
    const ticket = create(rows[0]);
    return ticket;
  }

  static create(
    user_id,
    event_id,
    stripe_session_id,
    confirmation_code,
    quantity,
    date_paid,
  ) {
    const ticket = new Ticket();
    ticket.user_id = user_id;
    ticket.event_id = event_id;
    ticket.stripe_session_id = stripe_session_id;
    ticket.confirmation_code = confirmation_code;
    ticket.quantity = quantity;
    ticket.date_paid = date_paid;
    return ticket;
  }
}

module.exports = Ticket;
