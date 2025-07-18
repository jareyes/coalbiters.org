const {Router} = require("express");
const carts = require("./carts");
const events = require("./events");
const tickets = require("./tickets");

const router = new Router();
router.get("/", (req, res) => res.render("index", {layout: false}));
router.get("/book-club", (req, res) => res.render("book-club", {layout: false}));
router.get("/about", (req, res) => res.render("about"));
router.get("/events", (req, res) => res.render("events"));

router.use(carts.MOUNT, carts);
router.use(events.MOUNT, events);
router.use(tickets.MOUNT, tickets);

module.exports = router;
