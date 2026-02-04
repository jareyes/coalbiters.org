const config = require("config");
const {Router} = require("express");
const middleware = require("../lib/middleware");
const User = require("../lib/model/user");

const MOUNTS = config.get("routes.mount");

async function login(req, res, next, sqlite) {
    try {
        const {email, password, redirect_url} = req.body;
        console.log({
            event: "Auth.ATTEMPT",
            email,
        });
        const user = User.get_by_email(sqlite, email);
        const context = {
            MOUNTS,
            email,
            password,
        };
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

function login_prompt(req, res, next) {
    try {
        const {
            redirect_url="/",
        } = req.query;
        const context = {redirect_url};
        res.render("auth/login", context);
    }
    catch(err) {
        next(err);
    }
}

function logout(req, res, next) {
    try {
        if(req.session !== undefined) {
            req.session.user = undefined;
        }
        next();
    }
    catch(err) {
        next(err);
    }
}

function create(sqlite) {
    const router = new Router();
    router.get("/login", login_prompt);
    router.post(
        "/login",
        middleware.supply(login, sqlite),
    );
    router.get("/logout", logout);
    return router;
}

exports.create = create;
        
