const email = require("./email");
const events = require("./events");
const {Router} = require("express");

const router = new Router();

router.get("/", (req, res) => res.render("index"));
router.get("/about", (req, res) => res.render("about"));
router.use("/email", email);
router.use("/events", events);

module.exports = router;
