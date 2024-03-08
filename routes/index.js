const {Router} = require("express");
const carts = require("./carts");
const events = require("./events");
const tickets = require("./tickets");

const router = new Router();
router.get("/", (req, res) => res.render("index"));
router.get("/about", (req, res) => res.render("about"));
router.get("/events", (req, res) => res.render("events"));

router.use(carts.MOUNT, carts);
router.use(events.MOUNT, events);
router.use(tickets.MOUNT, tickets);

module.exports = router;
