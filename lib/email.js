const config = require("config");
const nodemailer = require("nodemailer");

const MAIL_CONFIG = config.get("nodemailer");
const TRANSPORTER = nodemailer.createTransport(MAIL_CONFIG);

/* async */ function send_mail(recipient_email, subject, html, text) {
  return TRANSPORTER.sendMail({
    from: "\"Claremont Coalbiters\" <howdy@coalbiters.org>",
    to: recipient_email,
    subject,
    text,
    html,
  });
}

exports.send = send_mail;
