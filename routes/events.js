const Event = require("../lib/event");
const Reservation = require("../lib/reservation");
const {Router} = require("express");
const User = require("../lib/user");

async function signup(req, res, next) {
  const form = req.body;
  const email = form.email;
  const event_id = form.event_id;

  let user = await User.get_by_email(email);
  if(user === null) {
    user = User.create(email);
    await user.save()
  }
  console.log("user", user, "event_id", event_id);
  const reservation = Reservation.create(user.user_id, event_id);
  console.log(reservation);
  await reservation.save();

  const event = await Event.get_by_id(event_id);
  console.log("event_id", event_id, "event", event);
  res.redirect(`signup/${event.slug}`);
}

function signup_success(req, res) {
  const slug = req.params.slug;
  res.render(`events/success-${slug}`);
}

const router = new Router();
router.get("/", (req, res) => res.render("events"));
router.get("/:slug", (req, res) => {
  const slug = req.params.slug;
  res.render(`events/${slug}`);
});

router.post("/signup", signup);
router.get("/signup/:slug", signup_success);

module.exports = router;
