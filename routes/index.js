const {Router} = require("express");
const carts = require("./carts");
const events = require("./events");
const tickets = require("./tickets");

const router = new Router();
router.get(
    "/",
    (req, res) => res.render("index_template", {
        event: {
            title: "Silent Disco",
            subtitle: "Dance Party",
            start_time: "7",
            end_time: "10pm",
            weekday: "Friday",
            date: "February 20, 2026",
            latitude: 43.3715053,
            longitude: -72.3385251592626,
            venue: "Daddy's Pizza",
            venue_address: "50 Pleasant Street, Claremont, NH 03743",
            description: `<h2>Dancing and Daddy's Pizza!</h2>

<p>
Come fill the winter night with merriment and mirth with friends old and new. Switch back and forth between three simultaneous channel of dance music <em>free of charge</em>.
</p>
<p>
`
        },
    }),
);
router.get("/book-club", (req, res) => res.render("book-club", {layout: false}));
router.get("/about", (req, res) => res.render("about"));
router.get("/events", (req, res) => res.render("events"));

router.use(carts.MOUNT, carts);
router.use(events.MOUNT, events);
router.use(tickets.MOUNT, tickets);

module.exports = router;
