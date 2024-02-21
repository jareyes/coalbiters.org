const path = require("node:path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const {XMLParser} = require("fast-xml-parser");

const DOLLAR_FORMAT = new Intl.NumberFormat(
  "en-US",
  {style: "currency", currency: "USD"},
);
const DATE_PAID_FORMAT = new Intl.DateTimeFormat(
  "en-US",
  {
    dateStyle: "medium",
    timeZone: "America/New_York",
  }
);
const TIME_PAID_FORMAT = new Intl.DateTimeFormat(
  "en-US",
  {
    timeStyle: "short",
    timeZone: "America/New_York"
  }
);
const NONBREAKING_SPACE = String.fromCharCode(8239);

const FONT_DIR = path.join(__dirname, "/../var/font");
const QRCODE_OPTIONS = {type: "svg", errorCorrectionLevel: "Q"};
const XMLPARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix : "@_",
};
const ROBOTO_LIGHT_FILEPATH = path.join(FONT_DIR, "Roboto-Light.ttf");
const ROBOTO_MEDIUM_FILEPATH = path.join(FONT_DIR, "Roboto-Medium.ttf");
const ROBOTO_BOLD_FILEPATH = path.join(FONT_DIR, "Roboto-Bold.ttf");

function format_date_paid(d) {
  const date = DATE_PAID_FORMAT.format(d);
  const time = TIME_PAID_FORMAT.format(d);
  return `${date}, ${time.replace(NONBREAKING_SPACE, " ")}`;
}

async function write_pdf(ticket, event, user) {
  const pdf = new PDFDocument();
  const bufs = [];
  pdf.on("data", bufs.push.bind(bufs));

  const promise = new Promise(async (resolve, reject) => {
    pdf.on("error", reject);
    pdf.on("end", () => {
      const buf = Buffer.concat(bufs);
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

      pdf.translate(0, 8);
      pdf.fontSize(18);
      pdf.text(event.title);

      pdf.translate(0, 8);
      pdf.font("Roboto Medium").fontSize(14);
      pdf.text(`Confirmation: ${ticket.confirmation_code}`);

      pdf.save();
      pdf.translate(60, 150);
      await draw_qrcode(pdf, ticket.url);
      pdf.restore();

      pdf.save();
      pdf.translate(120, 30);
      pdf.font("Roboto Bold").fontSize(16);
      pdf.text(event.display_daterange);

      pdf.text(event.venue);
      pdf.text(event.venue_address);
      pdf.moveDown();

      pdf.font("Roboto Light");
      pdf.text("Admit: ", {continued: true});
      pdf.font("Roboto Bold");
      pdf.text(ticket.quantity);
      pdf.restore();

      pdf.translate(0, 64);
      pdf.fontSize(18);
      pdf.text("RECEIPT");
      pdf.translate(0, 8);

      pdf.save();
      pdf.fontSize(12);
      pdf.text("Amount Paid");
      pdf.moveUp();
      pdf.translate(108, 0);
      pdf.text("Date Paid");
      pdf.moveUp();
      pdf.translate(172, 0);
      pdf.text("Email Address");
      pdf.restore();

      pdf.moveDown(0.25);
      pdf.save();
      pdf.fontSize(14);
      const amount_total = event.price * ticket.quantity / 100;
      const amount_total_usd = DOLLAR_FORMAT.format(amount_total);
      pdf.text(amount_total_usd);
      pdf.moveUp();
      pdf.translate(108, 0);
      pdf.text(format_date_paid(ticket.date_paid));
      pdf.moveUp();
      pdf.translate(172, 0);
      pdf.text(user.email);
      pdf.restore();

      pdf.moveDown(1.5);
      pdf.fontSize(18);
      pdf.text("SUMMARY");
      pdf.save();
      pdf.fontSize(14);
      pdf.translate(24, 12);

      pdf.save();
      pdf.font("Roboto Medium");
      pdf.text("Silent Disco Ticket");
      pdf.moveUp();
      pdf.translate(280, 0);
      pdf.text(amount_total_usd, {align: "right", width: 100});
      pdf.restore();
      pdf.moveDown(0.125);

      pdf.save();
      pdf.font("Roboto Light");
      pdf.fontSize(12);
      pdf.text("Quantity: 3");
      pdf.moveUp();
      pdf.translate(280, 0);
      const unit_price_usd = DOLLAR_FORMAT.format(event.price / 100);
      pdf.text(`${unit_price_usd} per ticket`, {align: "right", width: 100});
      pdf.restore();

      pdf.moveDown(1);
      pdf.save();
      pdf.font("Roboto Medium");
      pdf.fontSize(14);
      pdf.text("Tax");
      pdf.moveUp();
      pdf.translate(280, 0);
      pdf.text("$0.00", {align: "right", width: 100});
      pdf.restore();

      pdf.moveDown(0.5);
      pdf.save();
      pdf.font("Roboto Medium");
      pdf.fontSize(14);
      pdf.text("Total");
      pdf.moveUp();
      pdf.translate(280, 0);
      pdf.font("Roboto Bold");
      pdf.text("$45.00", {align: "right", width: 100});
      pdf.restore();

      pdf.restore();
      pdf.font("Roboto Light");
      pdf.translate(0, 212);
      pdf.text("If you have any questions, contact us at ", {continued: true}); pdf.font("Roboto Medium");
      pdf.text("questions@coalbiters.org.");
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

exports.write_pdf = write_pdf;
