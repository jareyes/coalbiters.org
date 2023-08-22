#!/usr/bin/env node
"use strict";
const bunyan = require("express-bunyan-logger");
const config = require("config");
const express = require("express");
const {create: hbs} = require("express-handlebars");
const helpers = require("../lib/helpers");
const path = require("node:path");

const HBS = hbs({
  extname: "hbs",
  defaultLayout: "base",
  helpers,
});
const PORT = config.get("app.port");

const app = express();

// Templating
app.engine("hbs", HBS.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "..", "views/"));

app.use(bunyan());
app.use(bunyan.errorLogger());
app.use(express.static("static"));

app.get("/", (req, res) => res.render("index"));
app.get("/events", (req, res) => res.render("events"));
app.get("/about", (req, res) => res.render("about"));

if(require.main === module) {
  app.listen(
    PORT,
    () => console.log({event: "App.START", port: PORT}),
  );
}

module.exports = app;
