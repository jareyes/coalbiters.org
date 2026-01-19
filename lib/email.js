const config = require("config");
const nodemailer = require("nodemailer");
const template = require("./template");

const MAIL_CONFIG = config.get("nodemailer");
const TRANSPORTER = nodemailer.createTransport(MAIL_CONFIG);

/* async */ function send(
    recipient_email,
    subject,
    html,
    text,
    ics,
    attachment,
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
    
    if(attachment !== undefined) {
        message.attachments = [attachment];
    }
    
    return TRANSPORTER.sendMail(message);
}

async function send_confirmation(email_address, event, attachment=undefined) {
    const subject = `You're signed up for ${event.title}`;
    const locals = {
        event,
        layout: null,
    };
    const html = await template.render(
        "events/event-confirmation-email",
        locals,
    );
    const text = await template.render(
        "events/event-confirmation-email-text",
        locals,
    );
    const event_ics = await template.render(
        "events/event-ical",
        locals,
    );
    
    await send(
        email_address,
        subject,
        html,
        text,
        event_ics,
        attachment,
    );
    
    console.log(JSON.stringify({
        event: "Events.SEND_CONFIRMATION",
        email: email_address,
        event_slug: event.slug,
    }));
}

exports.send = send;
exports.send_confirmation = send_confirmation;
