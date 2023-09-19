#!/usr/bin/env node
"use strict";
const body_parser = require("body-parser");
const bunyan = require("express-bunyan-logger");
const config = require("config");
const database = require("../lib/database");
const express = require("express");
const events = require("../routes/events");
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
app.use(body_parser.urlencoded({extended: false}));

app.get("/", (req, res) => res.render("index"));
app.use("/events", events);
app.get("/about", (req, res) => res.render("about"));

if(require.main === module) {
  database.connect();
  app.listen(
    PORT,
    () => console.log({event: "App.START", port: PORT}),
  );
}

module.exports = app;
