const config = require("config");
const crypto = require("node:crypto");
const util = require("node:util");

const crypto_pbkdf2 = util.promisify(crypto.pbkdf2);

const ITERATIONS = 1000;
const SALT = config.get("app.salt");

function ban(sqlite, email, now_ms=Date.now()) {
    const user = get_by_email(sqlite, email);
    if(user === null) {
        return create(sqlite, {email, is_banned: true});
    }
    const statement = sqlite.prepare(
        `UPDATE users SET
           is_banned=1,
           updated_ms=:now_ms
         WHERE email=:email`,
    );
    statement.run({email, now_ms});
    user.is_banned = true;
    return user;
}

function convert(row) {
    return {
        user_id: row.user_id,
        created_at: new Date(row.created_ms),
        email: row.email,
        is_banned: !!row.is_banned,
        password_hash: row.password_hash,
        updated_at: new Date(row.updated_ms),
    };
}

function create(sqlite, {
    email,
    is_banned=false,
    password_hash=null,
    now_ms=Date.now(),
}) {
    const statement = sqlite.prepare(
        `INSERT INTO users (
            created_ms,
            email,
            is_banned,
            password_hash,
            updated_ms
         ) VALUES (
            :created_ms,
            :email,
            :is_banned,
            :password_hash,
            :updated_ms
        )`
    );
    statement.run({
        email,
        is_banned: +is_banned,
        password_hash,
        created_ms: now_ms,
        updated_ms: now_ms,       
    });
    return get_by_email(sqlite, email);
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

function has_permission(sqlite, user_id, group_name) {
    if(user_id === undefined) {
        return false;
    }
    const {count} = sqlite.prepare(
        `SELECT COUNT(*) AS count FROM permissions p
         JOIN groups g ON p.group_id = g.group_id
         WHERE p.user_id=:user_id AND g.name=:group_name`,
    ).get(
        {user_id, group_name},
    );
    return count > 0;
}

async function hash_password(
    password,
    digest="sha512",
    iterations=1000,
    key_length=64,
    salt=SALT,
) {
    const buf = await crypto_pbkdf2(
        password,
        salt,
        iterations,
        key_length,
        digest,
    );
    return buf.toString("hex");
}

exports.ban = ban;
exports.create = create;
exports.get_by_email = get_by_email;
exports.get_by_id = get_by_id;
exports.has_permission = has_permission;
exports.hash_password = hash_password;
