#!/usr/bin/env node
"use strict";
const body_parser = require("body-parser");
const bunyan = require("express-bunyan-logger");
const config = require("config");
const database = require("../lib/database");
const express = require("express");
const Event = require("../lib/model/event");
const path = require("node:path");
const process = require("node:process");
const routes = require("../routes");
const {DatabaseSync} = require("node:sqlite");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const template = require("../lib/template");

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const PORT = config.get("app.port");
const SESSION_SECRET = config.get("app.session_secret");
const SQLITE_FILEPATH = config.get("sqlite.filepath");

function create(sqlite) {
    const app = express();

    // Templates
    app.engine("hbs", template.engine);
    app.set("view engine", "hbs");
    app.set("views", path.join(__dirname, "..", "views/"));
    // Template variables
    app.locals.mounts = config.get("routes.mount")
    
    // Middleware
    app.use(session({
        store: new SQLiteStore(),
        secret: SESSION_SECRET,
        cookie: {
            maxAge: MS_PER_WEEK,
        },
    }));
    // Make event count accessible to all templates
    app.use((req, res, next) => {
        try {
            const count = Event.count_all(sqlite);
            app.locals.event_count = count;
        }
        catch(err) {
            // Do not fail on middleware failure
            console.error({
                event: "App.EVENT_COUNT",
                name: err.name,
                message: err.message,
                stack: err.stack,
            });
        }
        next();
    });

    // app.use(bunyan());
    // app.use(bunyan.errorLogger());
    app.use(express.static("static"));
    app.use(body_parser.urlencoded({extended: false}));
    
    // Routes
    app.use(routes(sqlite));
    return app;
}

async function main() {
    process.env.TZ = "UTC";
    const sqlite = new DatabaseSync(SQLITE_FILEPATH);
    sqlite.exec("PRAGMA journal_mode = WAL");
    const app = create(sqlite);
    app.listen(
        PORT,
        () => console.log({
            event: "App.START",
            port: PORT,
        }),
    );
}

if(require.main === module) {
  main();
}
