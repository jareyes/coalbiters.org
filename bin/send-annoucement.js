#!/usr/bin/env node
const database = require("../lib/database");
const email = require("../lib/email");
const Event = require("../lib/model/event");
const process = require("node:process");
const template = require("../lib/template");

const HTML_VIEWNAME = "emails/upcoming-event-announcement";
const TEXT_VIEWNAME = "emails/upcoming-event-announcement-text";

async function get_emails() {
  const rows = await database.query("SELECT email FROM users");
  const emails = rows.map(row => row.email);
  return emails;
}

async function main(event_slug, emails) {
  database.connect();
  try {
    const event = await Event.get_by_slug(event_slug);
    const locals = {...event, layout: null};
    const html = await template.render(HTML_VIEWNAME, locals);
    const text = await template.render(TEXT_VIEWNAME, locals);
    const subject = `Join us for ${event.title}`;

    // Get a list of recipients
    if(emails.length < 1) {
      emails = await get_emails();
    }
    // Send off each email
    for(const email_address of emails) {
      try {
        await email.send(email_address, subject, html, text);
        console.log(`Sent to ${email_address}`);
      }
      catch(err) {
        console.log(err);
      }
    }
  }
  catch(err) {
    console.log(err)
  }
  finally {
    await database.close();
  }
}

if(require.main === module) {
  const [, , event_slug, ...emails] = process.argv;
  main(event_slug, emails);
}
