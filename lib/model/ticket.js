const config = require("config");
const crypto = require("node:crypto");
const math = require("../math");

// No I or O because they can look like 1 and 0.
const CONFIRMATION_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROUTES = config.get("routes");
const TICKETS_SALT = config.get("tickets.salt");

function convert(row) {
    return {
        ticket_id: row.ticket_id,
        user_id: row.user_id,
        event_id: row.event_id,
        confirmation_code: row.confirmation_code,
        quantity: row.quantity,
        created_at: new Date(row.created_ms),
        sent_at: new Date(row.sent_ms),
        used_at: new Date(row.used_ms),
        checkin_url: get_url(row.confirmation_code),
    };
}

function create(sqlite, {
    user_id,
    event_id,
    confirmation_code,
    quantity,
    sent_ms,
    now_ms=Date.now(),
}) {
    const statement = sqlite.prepare(
        `INSERT INTO tickets (
            user_id,
            event_id,
            confirmation_code,
            quantity,
            created_ms,
            sent_ms
         ) VALUES (
            :user_id,
            :event_id,
            :confirmation_code,
            :quantity,
            :created_ms,
            :sent_ms
         )`
    );
    statement.run({
        user_id,
        event_id,
        confirmation_code,
        quantity,
        created_ms: now_ms,
        sent_ms,
    });
    return get_by_confirmation_code(
        sqlite,
        confirmation_code,
    );
}

function generate_confirmation() {
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

function generate_validation_token(
    confirmation_code,
    salt=TICKETS_SALT,
) {
    const hmac = crypto.createHmac("sha256", salt);
    hmac.update(confirmation_code);
    const digest = hmac.digest("hex");
    return digest.slice(0, 6);
}

function get_by_confirmation_code(
    sqlite,
    confirmation_code,
) {
    const statement = sqlite.prepare("SELECT * FROM tickets WHERE confirmation_code=:confirmation_code");
    const row = statement.get({confirmation_code});
    const ticket = convert(row);
    return ticket;
}

function get_pdf_url(confirmation_code) {
    const {protocol, host} = ROUTES;
    const mount = ROUTES.mount.tickets;
    const token = generate_validation_token(confirmation_code);
    // Mounts start with a slash
    return `${protocol}://${host}${mount}/${confirmation_code}.pdf?token=${token}`;
}

function get_url(confirmation_code) {
    const {protocol, host} = ROUTES;
    const mount = ROUTES.mount.tickets;
    const token = generate_validation_token(confirmation_code);
    // Mounts start with a slash
    return `${protocol}://${host}${mount}/${confirmation_code}?token=${token}`;
}

function is_valid(confirmation_code, validation_token) {
    const candidate = generate_validation_token(
        confirmation_code
    );
    return (validation_token === candidate);
}

exports.create = create;
exports.generate_confirmation = generate_confirmation;
exports.generate_validation_token = generate_validation_token;
exports.get_by_confirmation_code = get_by_confirmation_code;
exports.get_pdf_url = get_pdf_url;
exports.get_url = get_url;
exports.is_valid = is_valid;
