const config = require("config");
const Event = require("../lib/model/event");
const {Router} = require("express");
const middleware = require("../lib/middleware");

const MOUNTS = config.get("routes.mount");

function edit_event(req, res, next, sqlite) {
    try {
        const {event_id} = req.params;
        const context = {};
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
            MOUNTS,
            events,
        };
        res.render("admin/events-list", context);
    }
    catch(err) {
        next(err);
    }
}

function create(sqlite) {
    const router = new Router();
    router.get(
        "/events",
        middleware.supply(list_events, sqlite),
    );
    router.get(
        "/event/:event_id",
        middleware.supply(edit_event, sqlite),
    );
    return router;
}

exports.create = create;
exports.MOUNT = "/grayskull";
