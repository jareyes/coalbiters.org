const {Router} = require("express");
const User = require("../lib/user");

const router = new Router();

async function signup(req, res, next) {
  const form = req.body;
  const email = form.email;
  const user = User.create(email);
  await user.save();
  res.redirect("signup");
}

function signup_success(req, res) {
  res.render("events/success");
}

router.get("/", (req, res) => res.render("events"));
router.get("/2023-10-03-playdate", (req, res) => res.render("events/2023-10-03-playdate"));

router.post("/signup", signup);
router.get("/signup", signup_success);

module.exports = router;
