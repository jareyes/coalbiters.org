const body_parser = require("body-parser");
const config = require("config");
const {Router} = require("express");
const Stripe = require("stripe");

const STRIPE_API_KEY = config.get("stripe.api_key");
const STRIPE_PUBLIC_KEY = config.get("stripe.public_key");
const stripe = Stripe(STRIPE_API_KEY);



async function create_session(req, res, next) {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: 'price_1OkFRBDBDUSJ7VKx9OXWGIJP',
          quantity: 1,
          adjustable_quantity: {enabled: true, maximum: 10},
        },
      ],
      automatic_tax: {enabled: true},
      mode: "payment",
      return_url: "http://localhost:4000/cart/cancel",
      ui_mode: "embedded",
    });

    res.json({clientSecret: session.client_secret});
  }
  catch(err) {
    next(err);
  }
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
    const session = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      { expand: ["line_items"] },
    );
    const line_items = session.line_items;

    switch(event.type) {
      case "checkout.session.completed": {
        if(session.payment_status === "paid") {
          // FIXME: Create and send out ticket
        }
        break;
      }
      case "checkout.session.async_payment_suceeded": {
        // FIXME: Create and send out ticket
        break;
      }
      case "checkout.session.async_payment_failed": {
        // FIXME: Send out failed payment email
      }
    }

    response.status(200).end();
  }
  catch(err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
}

const router = new Router();

router.post("/session", create_session);
router.post("/events", body_parser.json(), events_webhook);
router.get("/checkout", (req, res) => res.render("cart/checkout", {stripe_public_key: STRIPE_PUBLIC_KEY}));
router.get("/success", (req, res) => res.render("cart/success", {layout: null}));
router.get("/cancel", (req, res) => res.render("cart/cancel", {layout: null}));

module.exports = router;
