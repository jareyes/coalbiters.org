#!/usr/bin/env node
const database = require("../lib/database");
const email = require("../lib/email");
const Event = require("../lib/event");
const process = require("node:process");

async function get_emails(event) {
  const rows = await database.query(
    "SELECT u.email AS email FROM users u JOIN reservations r on u.user_id = r.user_id WHERE r.event_id = ?",
    [event.event_id],
  );
  const emails = rows.map(row => row.email);
  return emails;
}

async function main(event_slug, emails) {
  database.connect();
  try {
    const event = await Event.get_by_slug(event_slug);
    if(emails.length < 1) {
      emails = await get_emails(event);
    }
    for(const address of emails) {
      await email.send_confirmation(address, event);
    }
  }
  finally {
    database.close();
  }
}

if(require.main === module) {
  const [, , event_slug, ...emails] = process.argv;
  main(event_slug, emails);
}
