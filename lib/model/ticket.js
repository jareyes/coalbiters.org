const config = require("config");
const database = require("../database");
const path = require("node:path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const {XMLParser} = require("fast-xml-parser");

const FONT_DIR = path.join(__dirname, "../var/font");
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

const ROUTES = config.get("routes");

async function write_pdf(ticket, event) {
  const pdf = new PDFDocument();
  const bufs = [];
  pdf.on("data", bufs.push.bind(bufs));

  const promise = new Promise((resolve, reject) => {
    pdf.on("error", reject);
    pdf.on("end", () => {
        const buf = Buffer.concat(bufs);
        return buf;
    });
  });

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

  pdf.translate(0, 8);
  pdf.fontSize(18);
  pdf.text("Silent Disco");

  pdf.translate(0, 8);
  pdf.font("Roboto Medium").fontSize(14);
  pdf.text(`Confirmation: ${ticket.confirmation_code}`);

  pdf.save();
  pdf.translate(60, 180);
  await draw_qrcode(pdf, ticket.url);
  pdf.restore();

  pdf.translate(120, 60);
  pdf.font("Roboto Bold").fontSize(16);
  pdf.text(event.humanized_date);
  pdf.text(event.venue);
  pdf.text(event.venue_address);
  pdf.text("\n");

  pdf.font("Roboto Light");
  pdf.text("Admit: ", {continued: true});
  pdf.font("Roboto Bold");
  pdf.text(ticket.admit_count);

  pdf.end();
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

  static async get_by_confirmation_code(confirmation_code) {
    const rows = await database.query(SELECT_BY_CODE, [confirmation_code]);
    if(rows.length < 1) {
      return null;
    }
    const ticket = create(rows[0]);
    return ticket;
  }
}

Ticket.MOUNT = "ticket";
Ticket.write_pdf;

module.exports = Ticket;
