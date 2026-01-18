function has_permission(sqlite, group_name) {
    return (req, res, next) => {
        // TODO
    };
}

function supply(route, ...resources) {
    return (req, res, next) => {
        route(req, res, next, ...resources);
    };
}

exports.has_permission = has_permission;
exports.supply = supply;
