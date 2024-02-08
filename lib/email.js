const config = require("config");
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const template = require("./template");

const MAIL_CONFIG = config.get("email.nodemailer");
const UNSUBSCRIBE_SALT = config.get("email.unsubscribe_salt");
const TRANSPORTER = nodemailer.createTransport(MAIL_CONFIG);

/* async */ function send(
  recipient_email,
  subject,
  html,
  text,
  ics,
) {
  const message = {
    from: "\"Claremont Coalbiters\" <howdy@coalbiters.org>",
    to: recipient_email,
    subject,
    text,
    html,
  };

  if(ics) {
    message.icalEvent = {
      filename: "invite.ics",
      method: "publish",
      content: ics,
    };
  }

  return TRANSPORTER.sendMail(message);
}

async function send_confirmation(email_address, event) {
  try {
    const subject = `You're signed up for ${event.title}`;
    const locals = {...event, end_datetime: event.end_datetime, layout: null};
    const html = await template.render("event-confirmation-email", locals);
    const text = await template.render("event-confirmation-email-text", locals);
    const event_ics = await template.render("event-ical", locals);

    await send(
      email_address,
      subject,
      html,
      text,
      event_ics,
    );

    console.log(JSON.stringify({
      event: "Events.SEND_CONFIRMATION",
      email: email_address,
      event_slug: event.slug,
    }));
  }
  // This function must never error. We send email
  // in the background and do not blow up the web
  // if it fails
  catch(err) {
    // TODO: Do something better
    console.error(err);
  }
}

function create_unsubscribe_token(email) {
  const hmac = crypto.createHmac("md5", UNSUBSCRIBE_SALT);
  hmac.update(email);
  return hmac.digest("base64url");
}

function validate_unsubscribe_token(email, token) {
  const attempt = create_unsubscribe_token(email);
  return attempt === token;
}

exports.send = send;
exports.send_confirmation = send_confirmation;
exports.create_unsubscribe_token = create_unsubscribe_token;
exports.validate_unsubscribe_token = validate_unsubscribe_token;
