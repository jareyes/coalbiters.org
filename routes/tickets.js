const config = require("config");
const email = require("../lib/email");
const Event = require("../lib/model/event");
const {Router} = require("express");
const template = require("../lib/template");
const Ticket = require("../lib/model/ticket");

const MOUNT = config.get("routes.mount.tickets");

const EVENT_DAY_FORMAT = Intl.DateTimeFormat("en-US", {weekday: "long"});
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
      event_series: "Silent Disco",
      event_title: "Winter Underground",
      event_day: EVENT_DAY_FORMAT.format(event.start_time),
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
    // res.status(200).end();
    res.render("emails/ticket-html", locals);
  }
  catch(err) {
    console.log(err);
    next(err);
  }
}

function validate_ticket(req, res, next) {
  console.log(req.params);
}

const router = new Router();
router.get("/:confirmation_code([A-Z]{5}\\d{1,2})", display_email);

router.MOUNT = MOUNT;
module.exports = router;
