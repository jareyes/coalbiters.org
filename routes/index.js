const {Router} = require("express");
const admin = require("./admin");
const auth = require("./auth");
const carts = require("./carts");
const config = require("config");
const Event = require("../lib/model/event");
const events = require("./events");
const middleware = require("../lib/middleware");
const tickets = require("./tickets");

const MOUNTS = config.get("routes.mount");

function home_page(req, res, next, sqlite) {
    try {
        const event = Event.get_by_slug(
            sqlite,
            "2026-02-20-silent-disco",
        );
        res.render("index_template", {event});
    }
    catch(err) {
        next(err);
    }
}

function create(sqlite) {
    const router = new Router();
    router.get("/", middleware.supply(home_page, sqlite));
    router.get("/about", (req, res) => res.render("about"));
    router.use(MOUNTS.admin, admin.create(sqlite));
    router.use(MOUNTS.auth, auth.create(sqlite));
    router.use(MOUNTS.events, events.create(sqlite));
    router.use(MOUNTS.tickets, tickets.create(sqlite));
    return router;
}

module.exports = create;
