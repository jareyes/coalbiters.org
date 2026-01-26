const config = require("config");
const Email = require("../lib/email");
const Event = require("../lib/model/event");
const {Router} = require("express");
const helpers = require("../lib/helpers");
const middleware = require("../lib/middleware");
const template = require("../lib/template");
const Receipt = require("../lib/receipt");
const Ticket = require("../lib/model/ticket");
const User = require("../lib/model/user");

function calendar(req, res, next, sqlite) {
    try {
        const days = [];
        const now = new Date();
        const last_sunday = new Date();
        last_sunday.setDate(now.getDate() - now.getDay());
        for(
            let i = 0, date = last_sunday;
            i < 7;
            i++, date.setDate(date.getDate() + 1)
        ) {
            days.push(new Date(date));
        }
        const context = {
            days,
            timezone: "UTC",
        };
        res.render("events/events-calendar", context);
    }
    catch(err) {
        next(err);
    }
}

function detail(req, res, next, sqlite) {
    try {
        const {slug} = req.params;
        const event = Event.get_by_slug(sqlite, slug);
        res.render("index_template", {event});
    }
    catch(err) {
        next(err);
    }
}

async function register(req, res, next, sqlite) {
    try {
        const form = req.body;
        const email = form.email_address;
        const event_id = form.event_id;
        const quantity = form.ticket_count;

        let user = User.get_by_email(sqlite, email);
        if(user === null) {
            user = User.create(sqlite, {email});
        }
        const confirmation_code = Ticket.generate_confirmation();
        const user_id = user.user_id;
        const ticket = Ticket.create(sqlite, {
            user_id,
            event_id,
            confirmation_code,
            quantity,
            sent_ms: Date.now()
        });
        const ticket_url = Ticket.get_url(confirmation_code);
        res.redirect(ticket_url);

        // Send confirmation email in background
        const event = Event.get_by_id(sqlite, event_id);
        const filename = `${event.slug}-ticket.pdf`;
        const pdf = await Receipt.write_pdf(
            ticket,
            event,
            user,
        );
        const attachment = {filename, content: pdf};
        Email.send_confirmation(email, event, attachment);
    }
    catch(err) {
        next(err);
    }
}

function create(sqlite) {
    const router = new Router();
    router.get(
        "/calendar",
        middleware.supply(calendar, sqlite)
    );
    router.get(
        "/:slug",
        middleware.supply(detail, sqlite)
    ),
    router.post(
        "/register",
        middleware.supply(register, sqlite)
    );
    return router;
}

exports.create = create;
