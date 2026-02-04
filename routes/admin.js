const config = require("config");
const Event = require("../lib/model/event");
const {Router} = require("express");
const middleware = require("../lib/middleware");
const path = require("node:path");
const User = require("../lib/model/user");

const MOUNTS = config.get("routes.mount");

function edit_event(req, res, next, sqlite) {
    try {
        const event = req.body;
        event.start_ms = Date.parse(event.iso_start);
        event.end_ms = Date.parse(event.iso_end);
        delete event.iso_start;
        delete event.iso_end;
        const now_ms = Date.now();
        event.updated_ms = now_ms;
        if(event.event_id === "") {
            // Clean up even more
            delete event.event_id;
            event.created_ms = now_ms;
            Event.create(sqlite, event);
        }
        else {
            Event.update(sqlite, event);
        }
        const redirect_url = path.join(
            MOUNTS.admin,
            "events",
        );
        res.redirect(redirect_url);
    }
    catch(err) {
        next(err);
    }
}

function read_event(req, res, next, sqlite) {
    try {
        const {event_id} = req.params;
        const context = {
            event: {
                icalendar_id: crypto.randomUUID(),
                price_cents: 0,
                timezone: "America/New_York",
            },
        };
        if(event_id !== undefined) {
            const event = Event.get_by_id(
                sqlite,
                event_id,
            );
            context.event = event;
        }
        res.render("admin/events-edit", context);
    }
    catch(err) {
        next(err);
    }
}

function list_events(req, res, next, sqlite) {
    try {
        const events = sqlite.prepare(
            "SELECT * FROM events"
        ).all();
        const context = {
            events,
        };
        res.render("admin/events-list", context);
    }
    catch(err) {
        next(err);
    }
}

function list_users(req, res, next, sqlite) {
    try {
        const users = User.list(sqlite);
        const context = {users};
        res.render("admin/users-list", context);
    }
    catch(err) {
        next(err);
    }
}

function ban_users(req, res, next, sqlite) {
    
}

function create(sqlite) {
    const router = new Router();
    router.use(
        middleware.has_permission(sqlite, "admin"),
    );
    router.get(
        "/events",        
        middleware.supply(list_events, sqlite),
    );
    router.get(
        "/events/create",
        middleware.supply(read_event, sqlite),
    );
    router.post(
        "/events/save",
        middleware.supply(edit_event, sqlite),
    );
    router.get(
        "/event/:event_id",
        middleware.supply(read_event, sqlite),
    );
    router.get(
        "/users",
        middleware.supply(list_users, sqlite),
    );
    return router;
}

exports.create = create;
