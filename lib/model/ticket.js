const config = require("config");
const database = require("../database");
const math = require("../math");
const path = require("node:path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const {XMLParser} = require("fast-xml-parser");

const FONT_DIR = path.join(__dirname, "../../var/font");
const QRCODE_OPTIONS = {type: "svg", errorCorrectionLevel: "Q"};
const XMLPARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix : "@_",
};
const ROBOTO_LIGHT_FILEPATH = path.join(FONT_DIR, "Roboto-Light.ttf");
const ROBOTO_MEDIUM_FILEPATH = path.join(FONT_DIR, "Roboto-Medium.ttf");
const ROBOTO_BOLD_FILEPATH = path.join(FONT_DIR, "Roboto-Bold.ttf");

const INSERT_QUERY = "INSERT INTO tickets (stripe_session_id, user_id, event_id, confirmation_code, quantity) VALUES (?, ?, ?, ?, ?)";
const SELECT_BY_CONFIRMATION_CODE = "SELECT * FROM tickets WHERE confirmation_code=?";

// No I or O because they can look like 1 and 0.
const CONFIRMATION_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

const ROUTES = config.get("routes");

async function write_pdf(ticket, event) {
  const pdf = new PDFDocument();
  const bufs = [];
  pdf.on("data", bufs.push.bind(bufs));

  const promise = new Promise(async (resolve, reject) => {
    pdf.on("error", reject);
    pdf.on("end", () => {
      const buf = Buffer.concat(bufs);
      console.log(bufs, buf);
      resolve(buf);
    });

    try {
      pdf.info["Title"] = `Claremont Coalbiters: ${event.title} Ticket`;
      pdf.info["Author"] = "Claremont Coalbiters";

      pdf.registerFont("Roboto Light", ROBOTO_LIGHT_FILEPATH);
      pdf.registerFont("Roboto Medium", ROBOTO_MEDIUM_FILEPATH);
      pdf.registerFont("Roboto Bold", ROBOTO_BOLD_FILEPATH);

      // Header
      pdf.font("Roboto Light").fontSize(24);
      pdf.text("Claremont Coalbiters");

      pdf.rect(0, 0, 100, 10);
      pdf.fill();
      pdf.stroke();
      console.log("HERE!");

      pdf.translate(0, 8);
      pdf.fontSize(18);
      pdf.text(event.title);
      console.log("THERE");

      pdf.translate(0, 8);
      pdf.font("Roboto Medium").fontSize(14);
      pdf.text(`Confirmation: ${ticket.confirmation_code}`);
      console.log("SPHERE!");
      pdf.save();
      pdf.translate(60, 180);
      await draw_qrcode(pdf, ticket.url);
      pdf.restore();
      console.log("MERE!");
      pdf.translate(120, 60);
      pdf.font("Roboto Bold").fontSize(16);
      pdf.text(event.display_daterange);
      console.log("Display!");
      pdf.text(event.venue);
      console.log("Venue!");
      pdf.text(event.venue_address);
      console.log("Address");
      pdf.text("\n");

      pdf.font("Roboto Light");
      pdf.text("Admit: ", {continued: true});
      pdf.font("Roboto Bold");
      pdf.text(ticket.quantity);
      console.log("Totes");
      pdf.end();
    }
    catch(err) {
      reject(err);
    }
  });
  return promise;
}

async function draw_qrcode(pdf, url) {
  const svg = await QRCode.toString(url, QRCODE_OPTIONS);
  const parser = new XMLParser(XMLPARSER_OPTIONS);
  const obj = parser.parse(svg);

  pdf.save();
  pdf.scale(3);
  for(const path of obj.svg.path) {
    const fill = path["@_fill"];
    const stroke = path["@_stroke"];
    const d = path["@_d"];

    pdf.save();
    pdf.path(d);
    if(fill && stroke) { pdf.fillAndStroke(fill, stroke); }
    else if(fill)      { pdf.fill(fill); }
    else if(stroke)    { pdf.stroke(stroke); }
    pdf.restore();
  }
  pdf.restore();
}

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
    // Mounts start with a slash
    return `${protocol}://${host}${mount}/${this.confirmation_code}`;
  }

  async save() {
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
  ) {
    const ticket = new Ticket();
    ticket.user_id = user_id;
    ticket.event_id = event_id;
    ticket.stripe_session_id = stripe_session_id;
    ticket.confirmation_code = confirmation_code;
    ticket.quantity = quantity;
    return ticket;
  }
}

Ticket.MOUNT = "ticket";
Ticket.write_pdf = write_pdf;

module.exports = Ticket;
