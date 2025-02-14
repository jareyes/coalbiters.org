const config = require("config");
const Stripe = require("stripe")

const stripe = Stripe(STRIPE_API_KEY);

function checkout(req, res, next) {
    const intent = 
}
