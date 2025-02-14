const config = require("config");
const email = require("../lib/email");
const Event = require("../lib/model/event");
const QRCode = require("qrcode");
const receipt = require("../lib/receipt");
const {Router} = require("express");
const template = require("../lib/template");
const Ticket = require("../lib/model/ticket");
const User = require("../lib/model/user");

const MOUNT = config.get("routes.mount.tickets");
const DATE_PAID_FORMAT = new Intl.DateTimeFormat(
  "en-US",
  {
    dateStyle: "short",
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
const EVENT_DATE_FORMAT = Intl.DateTimeFormat("en-US", {dateStyle: "long"});
const EVENT_TIME_FORMAT = Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  timeZone: "America/New_York"
});
const FULL_DATE_FORMAT = Intl.DateTimeFormat("en-US", {dateStyle: "long", timeStyle: "short", timeZone: "America/New_York"})
const DOLLAR_FORMAT = new Intl.NumberFormat(
  "en-US",
  {style: "currency", currency: "USD"},
);
const CHECK_IN_WINDOW_MS = 10 * 60 * 1000;
const QRCODE_OPTS = {width: 250, correctionLevel: "Q"};

function format_date_paid(d) {
    if(d === null) {
        return "";
    }
    const date = DATE_PAID_FORMAT.format(d);
    const time = TIME_PAID_FORMAT.format(d);
    return `${date} ${time}`;
}


function format_event_time(startDate, endDate) {
    // Days and months arrays for converting numerical values to names
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Get day, month, date, and year
    const dayName = days[startDate.getDay()];
    const month = months[startDate.getMonth()];
    const date = startDate.getDate();
    const year = startDate.getFullYear();
    
    // Format times
    const formatTime = (date, show_ampm=true) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        return `${hours}:${minutes}${show_ampm ? " " +ampm : ""}`;
    };
    
    const startTime = formatTime(startDate, false);
    const endTime = formatTime(endDate);
    
    // Combine all parts
    return `${dayName}, ${month} ${date}, ${year}. ${startTime}&ndash;${endTime}`;
}

function validate_ticket(req, res, next) {
  const {confirmation_code} = req.params;
  const {token: validation_token} = req.query;
  const is_valid = Ticket.is_valid(confirmation_code, validation_token);
  if(is_valid) { return next(); }
  res.sendStatus(400).end();
}

async function view_ticket_pdf(req, res, next) {
  try {
    const {confirmation_code} = req.params;
    const ticket = await Ticket.get_by_confirmation_code(confirmation_code);
    const event = await Event.get_by_id(ticket.event_id);
    const user = await User.get_by_id(ticket.user_id);
    const buf = await receipt.write_pdf(ticket, event, user);

    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Type", "application/pdf");
      const filename = `${event.slug}-ticket-${confirmation_code.toLowerCase()}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buf);
  }
  catch(err) {
    next(err);
  }
}

async function view_ticket(req, res, next) {
    try {
        const {confirmation_code} = req.params;
        const ticket = await Ticket.get_by_confirmation_code(confirmation_code);
        const event = await Event.get_by_id(ticket.event_id);
        const user = await User.get_by_id(ticket.user_id);

        const qrcode_data_url = await QRCode.toDataURL(ticket.checkin_url, QRCODE_OPTS);
        const amount_paid_usd = DOLLAR_FORMAT.format(event.price * ticket.quantity / 100);
        const date_paid = format_date_paid(ticket.date_paid);
        const unit_price_usd = DOLLAR_FORMAT.format(event.price / 100);
        const event_datetime = format_event_time(event.start_time, event.end_time);
        res.render("tickets/ticket-detail", {
            layout: false,
            ticket,
            event,
            user,
            event_datetime,
            amount_paid_usd,
            date_paid,
            qrcode_data_url,
            unit_price_usd,
            ticket_pdf_url: ticket.pdf_url,
        });
    }
    catch(err) {
        next(err);
    }
}

function is_too_early(start_ms, now_ms=Date.now()) {
  return start_ms - now_ms >= CHECK_IN_WINDOW_MS;
}

function is_too_late(start_ms, now_ms=Date.now()) {
  return now_ms - start_ms >= 0;
}

async function checkin_ticket(req, res, next) {
  try {
    const {confirmation_code} = req.params;
    const ticket = await Ticket.get_by_confirmation_code(confirmation_code);
    const event = await Event.get_by_id(ticket.event_id);
    const user = await User.get_by_id(ticket.user_id);
    const start_ms = event.start_time.getTime();
    const end_ms = event.end_time.getTime();
    const locals = {layout: "ticket-check-in", ticket, event};
    if(is_too_early(start_ms)) {
      const check_in_start = new Date(event.start_time.getTime() - CHECK_IN_WINDOW_MS);
      const formatted_check_in_start = FULL_DATE_FORMAT.format(check_in_start);
      return res.render(
        "tickets/pending-ticket",
        {
          ...locals,
          check_in_start: formatted_check_in_start,
        }
      );
    }
    if(is_too_late(end_ms)) {
      return res.render("tickets/expired-ticket", locals);
    }
    if(ticket.time_used !== null) {
      console.log("ticket.time_used", ticket.time_used);
      const checked_in_time = EVENT_TIME_FORMAT.format(ticket.time_used);
      return res.render("tickets/used-ticket", {checked_in_time, ...locals});
    }
    try {
      await ticket.punch();
      const user = await User.get_by_id(ticket.user_id);
      res.render("tickets/valid-ticket", {user, ...locals});
    }
    catch(err) {
      console.log(err);
      res.render("tickets/valid-ticket", locals);
    }
  }
  catch(err) {
    console.log(err);
    res.render("tickets/invalid-ticket", {layout: "ticket-check-in"});
  }
}

const router = new Router();
router.get("/check-in/:confirmation_code([A-Z]{5}\\d{1,2})", checkin_ticket);
router.get(
    "/:confirmation_code([A-Z]{5}\\d{1,2})",
    validate_ticket,
    view_ticket,
);
router.get(
  "/:confirmation_code([A-Z]{5}\\d{1,2}).pdf",
  validate_ticket,
  view_ticket_pdf,
);

router.MOUNT = MOUNT;
module.exports = router;
