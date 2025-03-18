#!/usr/bin/env node
const Email = require("../lib/email");
const fs = require("node:fs");
const process = require("node:process");

async function get_emails() {
    const rows = await database.query("SELECT email FROM users");
    const emails = rows.map(row => row.email);
    return emails;
}

async function main(subject, html_filepath, text_filepath, emails) {
    const html = await fs.promises.readFile(html_filepath);
    const text = await fs.promises.readFile(text_filepath);
    for(const email of emails) {
        try {
            await Email.send(email, subject, html, text);
            console.log(`Sent to ${email}`);
        }
        catch(err) {
            console.log(err);
        }
    }
}

if(require.main === module) {
    const [subject, html_filepath, txt_filepath, ...emails] = process.argv.slice(2);
    if(
        subject === undefined ||
        html_filepath === undefined ||
        txt_filepath === undefined ||
        emails.length < 1
    ) {
        console.log("Usage: send-email.js <subject> <html filepath> <txt filepath> <...emails>");
        process.exit(1);
    }
    main(subject, html_filepath, txt_filepath, emails);
}
