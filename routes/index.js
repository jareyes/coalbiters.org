const email = require("./email");
const events = require("./events");
const {Router} = require("express");

const router = new Router();

router.get("/", (req, res) => res.render("index"));
router.get("/about", (req, res) => res.render("about"));
router.get("/events", (req, res) => res.render("events"));
router.use("/email", email);
router.use("/event", events);

module.exports = router;
