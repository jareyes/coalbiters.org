const {Router} = require("express");
const carts = require("./carts");
const Event = require("../lib/model/event");
const events = require("./events");
const middleware = require("../lib/middleware");
const tickets = require("./tickets");

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
    console.log("create", "sqlite", sqlite);
    const router = new Router();
    router.get("/", middleware.supply(home_page, sqlite));
    return router;
}

module.exports = create;
