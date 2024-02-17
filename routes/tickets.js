const {Router} = require("express");
const Ticket = require("../lib/ticket");

function validate_ticket(req, res, next) {
  console.log(req.params);
}

const router = new Router();
router.get(":confirmation(^[A-Z]{5}\d{1,2})", validate_ticket);

module.exports = router;
