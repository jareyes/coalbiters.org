const path = require("node:path");
const QRCode = require("qrcode");
const PDFDocument = require('pdfkit');
const {XMLParser} = require("fast-xml-parser");

const QRCODE_OPTIONS = {type: "svg", errorCorrectionLevel: "Q"};
const XMLPARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix : "@_",
};
const FONT_DIR = path.join(__dirname, "../var/font");
const ROBOTO_LIGHT_FILEPATH = path.join(FONT_DIR, "Roboto-Light.ttf");
const ROBOTO_MEDIUM_FILEPATH = path.join(FONT_DIR, "Roboto-Medium.ttf");
const ROBOTO_BOLD_FILEPATH = path.join(FONT_DIR, "Roboto-Bold.ttf");

const TICKET_URL = "https://coalbiters.org/ticket";

async function write_pdf(ticket, event) {
  const pdf = new PDFDocument();
  const bufs = [];
  pdf.on("data", bufs.push.bind(bufs));

  const promise = new Promise((resolve, reject) => {
    pdf.on("error", reject);
    pdf.on("end", () => {
        const buf = Buffer.concat(bufs);
        return buf;
    }),
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
  pdf.text(`Confirmation: ${ticket.confirmation}`);

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

class Ticket {
  constructor() {}

  get url() {
    return `${TICKET_URL}/${this.confirmation}`;
  }
}

Ticket.write_pdf = write_pdf;

module.exports = Ticket;
