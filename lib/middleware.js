const config = require("config");
const path = require("node:path");
const User = require("./model/user");

const MOUNTS = config.get("routes.mount");
const LOGIN_URL = path.join(MOUNTS.auth, "login");
                            
function has_permission(sqlite, group_name) {
    return (req, res, next) => {
        try {
            const {user} = req.session;
            if(user === undefined) {
                const redirect_url = req.url;
                return res.redirect(
                    `${LOGIN_URL}?redirect_url=${redirect_url}`,
                );
            }
            const has_permission = User.has_permission(
                sqlite,
                user?.user_id,
                group_name,
            );
            if(has_permission) {
                next();
            }
        }
        catch(err) {
            next(err);
        }
    };
}

function supply(route, ...resources) {
    return (req, res, next) => {
        route(req, res, next, ...resources);
    };
}

exports.has_permission = has_permission;
exports.supply = supply;
