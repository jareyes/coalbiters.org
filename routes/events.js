const email = require("../lib/email");
const Event = require("../lib/event");
const Reservation = require("../lib/reservation");
const helpers = require("../lib/helpers");
const {Router} = require("express");
const template = require("../lib/template");
const User = require("../lib/user");

async function send_confirmation(email_address, event) {
  try {
    const subject = `You're signed up for ${event.title}`;
    const locals = {...event, end_datetime: event.end_datetime, layout: null};
    const html = await template.render("event-confirmation-email", locals);
    const text = await template.render("event-confirmation-email-text", locals);
    const event_ics = await template.render("event-ical", locals);
    await email.send(
      email_address,
      subject,
      html,
      text,
      event_ics
    );
    console.log(JSON.stringify({event: "Events.SEND_CONFIRMATION", email: email_address, event_slug: event.slug}));
  }
  // This function must never error. We send email
  // in the background and do not blow up the web
  // if it fails
  catch(err) {
    // TODO: Do something better
    console.error(err);
  }
}

async function event_registration(req, res, next) {
  try {
    const form = req.body;
    const email = form.email;
    const event_id = form.event_id;

    let user = await User.get_by_email(email);
    if(user === null) {
      user = User.create(email);
      await user.save()
    }

    const reservation = Reservation.create(user.user_id, event_id);
    await reservation.save();

    const event = await Event.get_by_id(event_id);
    res.redirect(`${event.slug}/confirmed`);

    // Send confirmation email in background
    send_confirmation(email, event);
  }
  catch(err) {
    next(err);
  }
}

function signup_success(req, res) {
  const slug = req.params.slug;
  res.render(`events/success-${slug}`);
}

async function event_ics(req, res, next) {
  try {
    const slug = req.params.slug;
    const event = await Event.get_by_slug(slug);
    // Computed property, add it to locals
    const end_datetime = event.end_datetime;
    const locals = {end_datetime, layout: null, ...event};

    res.header("Content-Type", "text/calendar");
    res.render("event-ical", locals);
  }
  catch(err) {
    next(err);
  }
}

async function event_detail(req, res, next) {
  try {
    const slug = req.params.slug;
    const event = await Event.get_by_slug(slug);
    const event_daterange = helpers.display_daterange(
      event.start_datetime,
      event.duration_m,
    );
    const registration_open = (Date.now() < event.start_datetime.getTime());
    const locals = {...event, event_daterange, registration_open};
    res.render("event-detail", locals);
  }
  catch(err) {
    next(err);
  }
}

async function event_confirmation(req, res, next) {
  try {
    const slug = req.params.slug;
    const event = await Event.get_by_slug(slug);
    const locals = {
      ...event,
      title: "Signup Confirmation",
      event_title: event.title,
    };
    res.render("event-confirmation", locals);
  }
  catch(err) {
    next(err);
  }
}

const router = new Router();
router.get("/", (req, res) => res.render("events"));
router.post("/signup", event_registration);
router.get("/:slug", event_detail);
router.get("/:slug/confirmed", event_confirmation);
router.get("/:slug/invite.ics", event_ics);

module.exports = router;
