const config = require("config");
const {Router} = require("express");
const middleware = require("../lib/middleware");
const User = require("../lib/model/user");

const MOUNTS = config.get("routes.mount");

async function login(req, res, next, sqlite) {
    try {
        console.log("here");
        const {redirect_url} = req.query;
        const {email, password} = req.body;
        const user = User.get_by_email(sqlite, email);
        const context = {
            MOUNTS,
            email,
            password,
        };
        console.log("user", user);
        if(user === null) {
            context.form_error = "Invalid login credentials";
            return res.render(
                "auth/login",
                context,
            );
        }
        const password_hash = await User.hash_password(
            password,
        );
        if(password_hash !== user.password_hash) {
            context.form_error = "Invalid login credentials";
            return res.render(
                "auth/login",
                context,
            );
        }
        req.session.user = user;
        res.redirect(redirect_url);
    }
    catch(err) {
        next(err);
    }
}

function create(sqlite) {
    const router = new Router();
    router.get(
        "/login",
        (req, res) => res.render("auth/login", {MOUNTS}),
    );
    router.post(
        "/login",
        middleware.supply(login, sqlite),
    );
    return router;
}

exports.create = create;
        
