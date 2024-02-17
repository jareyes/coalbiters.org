#!/usr/bin/env node
const database = require("../lib/database");
const email = require("../lib/email");
const Event = require("../lib/model/event");
const process = require("node:process");
const template = require("../lib/template");

async function main(month, year, emails) {
  database.connect();
  try {

  }
  finally {
    database.close();
  }
}

if(require.main === module) {
  const [, , month, year, ...emails] = process.argv;
  main(event_slug, emails);
}
