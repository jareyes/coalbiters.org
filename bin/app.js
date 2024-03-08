#!/usr/bin/env node
"use strict";
const body_parser = require("body-parser");
const bunyan = require("express-bunyan-logger");
const config = require("config");
const database = require("../lib/database");
const express = require("express");
const path = require("node:path");
const process = require("node:process");
const routes = require("../routes");
const template = require("../lib/template");

const PORT = config.get("app.port");
const app = express();

// Templates
app.engine("hbs", template.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "..", "views/"));

// Middleware
// app.use(bunyan());
// app.use(bunyan.errorLogger());
app.use(express.static("static"));
app.use(body_parser.urlencoded({extended: false}));

// Routes
app.use(routes);

async function main() {
  process.env.TZ = "UTC";
  await database.connect();
  app.listen(
    PORT,
    () => console.log({event: "App.START", port: PORT}),
  );
}

if(require.main === module) {
  main();
}

module.exports = app;
