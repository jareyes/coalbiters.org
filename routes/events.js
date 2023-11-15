const Event = require("../lib/event");
const Reservation = require("../lib/reservation");
const {Router} = require("express");
const User = require("../lib/user");

async function signup(req, res, next) {
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
    res.redirect(`signup/${event.slug}`);
  }
  catch(err) {
    next(err);
  }
}

function signup_success(req, res) {
  const slug = req.params.slug;
  res.render(`events/success-${slug}`);
}

async function ical_event(req, res) {
  try {
    const slug = req.params.slug;
    const event = await Event.get_by_slug(slug);

    console.log("event", event);

    res.header("Content-Type", "text/calendar");
    res.render("event-ical", {...event, layout: null});
  }
  catch(err) {
    next(err);
  }
}

const router = new Router();
router.get("/", (req, res) => res.render("events"));

router.get("/:slug", (req, res) => {
  const slug = req.params.slug;
  res.render(`events/${slug}`);
});
router.get("/:slug/invite.ics", ical_event);

router.post("/signup", signup);
router.get("/signup/:slug", signup_success);

module.exports = router;
