const config = require("config");
const email = require("../lib/email");
const Event = require("../lib/model/event");
const middleware = require("../lib/middleware");
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
const EVENT_DATETIME_FORMAT = Intl.DateTimeFormat(
    "en-US",
    {
	dateStyle: "full",
	timeStyle: "short",
	timeZone: "America/New_York",
    },
);
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


function format_event_time(start_date, end_date) {
    const formatted = EVENT_DATETIME_FORMAT.formatRange(start_date, end_date);
    return formatted;
}

function validate_ticket(req, res, next) {
    const {confirmation_code} = req.params;
    const {token: validation_token} = req.query;
    const is_valid = Ticket.is_valid(
        confirmation_code,
        validation_token,
    );
    if(is_valid) {
        return next();
    }
    res.sendStatus(400).end();
}

async function view_ticket_pdf(req, res, next, sqlite) {
    try {
        const {confirmation_code} = req.params;
        const ticket = Ticket.get_by_confirmation_code(
            sqlite,
            confirmation_code
        );
        const {
            event_id,
            user_id,
        } = ticket;
        const event = await Event.get_by_id(sqlite, event_id);
        const user = await User.get_by_id(sqlite, user_id);
        const buf = await receipt.write_pdf(
            ticket,
            event,
            user,
        );

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

async function view_ticket(req, res, next, sqlite) {
    try {
        const {confirmation_code} = req.params;
        const ticket = Ticket.get_by_confirmation_code(
            sqlite,
            confirmation_code
        );
        const event = Event.get_by_id(sqlite, ticket.event_id);
        const user = User.get_by_id(sqlite, ticket.user_id);

        const ticket_url = Ticket.get_url(ticket.confirmation_code);
        const qrcode_data_url = await QRCode.toDataURL(
            ticket_url,
            QRCODE_OPTS,
        );
        const amount_paid_usd = DOLLAR_FORMAT.format(event.price_cents * ticket.quantity / 100);
        const date_paid = format_date_paid(ticket.date_paid);
        const unit_price_usd = DOLLAR_FORMAT.format(event.price_cents / 100);
        const event_datetime = format_event_time(event.start, event.end);
        const ticket_pdf_url = Ticket.get_pdf_url(ticket.confirmation_code);
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
            ticket_pdf_url,
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

function create(sqlite) {
    const router = new Router();
    router.get(
        "/check-in/:confirmation_code([A-Z]{5}\\d{1,2})",
        checkin_ticket,
    );
    router.get(
        "/:confirmation_code([A-Z]{5}\\d{1,2})",
        validate_ticket,
        middleware.supply(view_ticket, sqlite),
    );
    router.get(
        "/:confirmation_code([A-Z]{5}\\d{1,2}).pdf",
        validate_ticket,
        middleware.supply(view_ticket_pdf, sqlite),
    );
    return router;
}

exports.MOUNT = MOUNT;
exports.create = create;
