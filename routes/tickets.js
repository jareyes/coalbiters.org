const config = require("config");
const Event = require("../lib/model/event");
const {Router} = require("express");
const Ticket = require("../lib/model/ticket");

const MOUNT = config.get("routes.mount.tickets");

const EVENT_DAY_FORMAT = Intl.DateTimeFormat("en-US", {weekday: "long"});
const EVENT_DATE_FORMAT = Intl.DateTimeFormat("en-US", {dateStyle: "long"});

async function email(req, res, next) {
  try {
    const {confirmation_code} = req.params;
    const ticket = await Ticket.get_by_confirmation_code(confirmation_code);
    const event = await Event.get_by_id(ticket.event_id);
    const locals = {
      layout: null,
      event_series: "Silent Disco",
      event_title: "Winter Underground",
      event_day: EVENT_DAY_FORMAT.format(event.start_time),
      event_date: EVENT_DATE_FORMAT.format(event.start_time),
      ticket_url: ticket.url,
      support_url: "mailto:questions@coalbiters.org"
    }
    res.render("emails/ticket-html.hbs", locals);
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
router.get("/:confirmation_code([A-Z]{5}\\d{1,2})", email);

router.MOUNT = MOUNT;
module.exports = router;
