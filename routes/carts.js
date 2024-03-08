const config = require("config");
const email = require("../lib/email");
const Event = require("../lib/model/event");
const express = require("express");
const receipt = require("../lib/receipt");
const {Router} = require("express");
const Stripe = require("stripe");
const Ticket = require("../lib/model/ticket");
const User = require("../lib/model/user");

const ROUTES = config.get("routes");
const MOUNT = ROUTES.mount.carts;
const STRIPE_API_KEY = config.get("stripe.api_key");
const STRIPE_PUBLIC_KEY = config.get("stripe.public_key");
const STRIPE_WEBHOOK_SECRET = "whsec_889a10ebcefe709f0a191ae29d376f527dc47bec2cd3d67fa6194d8a7c921e5b";

const stripe = Stripe(STRIPE_API_KEY);

function get_return_url() {
  const {protocol, host} = ROUTES;
  return `${protocol}://${host}${MOUNT}/success`;
}

function checkout(req, res, next) {
  const form = req.body;
  const event_id = form.event_id;
  const locals = {event_id, stripe_public_key: STRIPE_PUBLIC_KEY};
  res.render("cart/checkout", locals);
}

async function create_session(req, res, next) {
  try {
    const form = req.body;
    const event_id = form.event_id;
    const event = await Event.get_by_id(event_id);
    const confirmation_code = Ticket.generate_confirmation();
    const return_url = get_return_url();

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: event.stripe_price_id,
          quantity: 1,
          adjustable_quantity: {enabled: true, maximum: 10},
        },
      ],
      automatic_tax: {enabled: true},
      metadata: {confirmation_code, event_id},
      mode: "payment",
      return_url: return_url,
      ui_mode: "embedded",
    });

    res.json({clientSecret: session.client_secret});
  }
  catch(err) {
    next(err);
  }
}

async function fulfill_order(session) {
  // Create user
  const email = session.customer_details.email;
  const user = User.create(email);
  await user.save();
  const {user_id} = user;

  // Create ticket
  const {event_id, confirmation_code} = session.metadata;
  const {line_items} = session;
  const quantity = line_items.data[0].quantity;
  const date_paid = new Date(session.created * 1000);
  const ticket = Ticket.create(
    user_id,
    event_id,
    session.id,
    confirmation_code,
    quantity,
    date_paid,
  );
  await ticket.save();

  // Create PDF
  const event = await Event.get_by_id(event_id);
  const pdf = await receipt.write_pdf(ticket, event, user);

  // Send it out
  return pdf;
}

async function events_webhook(req, res) {
  const payload = req.body;
  const signature = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );

    if(event.data.object.object !== "checkout.session") {
      return res.sendStatus(200);
    }

    const session = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      { expand: ["line_items"] },
    );

    if(
      event.type === "checkout.session.completed" &&
      session.payment_status === "paid"
    ) {
      await fulfill_order(session);
    }

    res.sendStatus(200);
  }
  catch(err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    console.log(err);
  }
}

const router = new Router();
router.post("/session", create_session);
router.post("/hook", express.raw({type: "application/json"}), events_webhook);
router.post("/checkout", checkout);
router.get("/success", (req, res) => res.render("cart/success", {layout: null}));

router.MOUNT = MOUNT;
router.fulfill_order = fulfill_order;
module.exports = router;
