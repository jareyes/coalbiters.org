const email = require("../lib/email");
const {Router} = require("express");
const User = require("../lib/model/user");

async function unsubscribe(req, res, next) {
  try {
    const {email, token} = req.query;
    if(!email.validate_unsubscribe_token(email, token)) {
      // FIXME: Respond with error code and page
      return next(err);
    }
    const user = await User.get_by_email(email);
    user.unsubscribed = true;
    await user.save();
    res.render("blah");
  }
  catch(err) {
    next(err);
  }
}

const router = new Router();

router.get("unsubscribe", unsubscribe);

module.exports = router;
