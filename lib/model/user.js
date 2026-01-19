function convert(row) {
    return {
        user_id: row.user_id,
        created_at: new Date(row.created_ms),
        email: row.email,
        updated_at: new Date(row.updated_ms),
    };
}

function get_by_email(sqlite, email) {
    const statement = sqlite.prepare("SELECT * FROM users WHERE email=:email");
    const row = statement.get({email});
    if(row === undefined) {
        return null;
    }
    const user = convert(row);
    return user;
}

function get_by_id(sqlite, user_id) {
    const statement = sqlite.prepare("SELECT * FROM users WHERE user_id=:user_id");
    const row = statement.get({user_id});
    if(row === undefined) {
        return null;
    }
    const user = convert(row);
    return user;
}

function create(sqlite, {
    email,
    now_ms=Date.now(),
}) {
    console.log("user.create", "email", email);
    const statement = sqlite.prepare(
        `INSERT INTO users (
            created_ms,
            email,
            updated_ms
         ) VALUES (
            :created_ms,
            :email,
            :updated_ms
        )`
    );
    statement.run({
        email,
        created_ms: now_ms,
        updated_ms: now_ms,       
    });
    return get_by_email(sqlite, email);
}

exports.create = create;
exports.get_by_email = get_by_email;
exports.get_by_id = get_by_id;
