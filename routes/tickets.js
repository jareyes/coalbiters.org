const config = require("config");
const email = require("../lib/email");
const Event = require("../lib/model/event");
const receipt = require("../lib/receipt");
const {Router} = require("express");
const template = require("../lib/template");
const Ticket = require("../lib/model/ticket");
const User = require("../lib/model/user");

const MOUNT = config.get("routes.mount.tickets");

const EVENT_WEEKDAY_FORMAT = Intl.DateTimeFormat("en-US", {weekday: "long"});
const EVENT_DATE_FORMAT = Intl.DateTimeFormat("en-US", {dateStyle: "long"});
const EVENT_TIME_FORMAT = Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
  timeZone: "America/New_York"
});
const PAID_DATE_FORMAT = Intl.DateTimeFormat("en-us", {dateStyle: "long"});
const DOLLAR_FORMAT = new Intl.NumberFormat(
  "en-US",
  {style: "currency", currency: "USD"},
);
const ONE_HOUR_MS = 60 * 60 * 1000;

function format_event_times(start_date, end_date) {
  const range = EVENT_TIME_FORMAT.formatRange(start_date, end_date);
  return range.replaceAll(":00", "");
}

async function display_email(req, res, next) {
  try {
    const {confirmation_code} = req.params;
    const ticket = await Ticket.get_by_confirmation_code(confirmation_code);
    const event = await Event.get_by_id(ticket.event_id);
    const ticket_amount = DOLLAR_FORMAT.format(ticket.quantity * event.price / 100);

    const locals = {
      layout: null,
      confirmation_code: ticket.confirmation_code,
      date_paid: PAID_DATE_FORMAT.format(ticket.date_paid),
      directions: event.directions,
      event_series: event.series,
      event_title: event.title,
      event_weekday: EVENT_WEEKDAY_FORMAT.format(event.start_time),
      event_date: EVENT_DATE_FORMAT.format(event.start_time),
      event_times: format_event_times(event.start_time, event.end_time),
      line_items: [
        {
          description: "Silent Disco Ticket",
          quantity: ticket.quantity,
          amount: ticket_amount,
        },
        {
          description: "Tax",
          amount: DOLLAR_FORMAT.format(0),
        }
      ],
      location_url: event.location_url,
      ticket_url: ticket.url,
      support_url: "mailto:questions@coalbiters.org",
      venue_address: event.venue_address,
      total: ticket_amount,
    }

    // const html = await template.render("emails/ticket-html", locals);
    // await email.send("josh@joshreyes.com", "Tickets Yo", html, "Read the html");
    res.render("emails/ticket-html", locals);
  }
  catch(err) {
    console.log(err);
    next(err);
  }
}

function validate_ticket(req, res, next) {
  const {confirmation_code} = req.params;
  const {token: validation_token} = req.query;
  const is_valid = Ticket.is_valid(confirmation_code, validation_token);
  if(is_valid) { return next(); }
  res.sendStatus(400).end();
}

async function view_ticket(req, res, next) {
  try {
    const {confirmation_code} = req.params;
    const ticket = await Ticket.get_by_confirmation_code(confirmation_code);
    const event = await Event.get_by_id(ticket.event_id);
    const user = await User.get_by_id(ticket.user_id);
    const buf = await receipt.write_pdf(ticket, event, user);

    res.setHeader("Content-Length", buf.length);
    res.setHeader("Content-Type", "application/pdf");
    const filename = `coalbiters-disco-ticket-${confirmation_code.toLowerCase()}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buf);
  }
  catch(err) {
    next(err);
  }
}

function is_too_early(start_ms, now_ms=Date.now()) {
  return now_ms - start_ms >= ONE_HOUR_MS;
}

function is_too_late(start_ms, now_ms=Date.now()) {
  return now_ms - start_ms <= 0;
}

async function checkin_ticket(req, res, next) {
  try {
    const {confirmation_code} = req.params;
    const ticket = await Ticket.get_by_confirmation_code(confirmation_code);
    const event = await Event.get_by(event.event_id);
    const start_ms = event.start_time.getTime();
    const end_ms = event.end_time.getTime();

    if(is_too_early(start_ms)) {
      return res.render("tickets/pending-ticket", {ticket, event});
    }
    if(is_too_late(end_ms)) {
      return res.render("tickets/expired-ticket", {ticket, event});
    }
    if(ticket.date_paid !== undefined) {
      return res.render("tickets/used-ticket", {ticket, event});
    }
    try {
      ticket.date_paid = new Date();
      await ticket.save();
      const user = await User.get_by_id(ticket.user_id);
      res.render("tickets/valid-ticket", {ticket, event, user});
    }
    catch(err) {
      console.log(err);
      res.render("tickets/valid-ticket", {ticket, event, error_saving: true});
    }
  }
  catch(err) {
    console.log(err);
    res.render("tickets/invalid-ticket");
  }
}

const router = new Router();
router.get("/check-in/:confirmation_code([A-Z]{5}\\d{1,2})", checkin_ticket);
router.get(
  "/:confirmation_code([A-Z]{5}\\d{1,2})",
  validate_ticket,
  view_ticket,
);

router.MOUNT = MOUNT;
module.exports = router;
