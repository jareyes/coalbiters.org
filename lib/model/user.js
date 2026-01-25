const config = require("config");
const crypto = require("node:crypto");
const util = require("node:util");

const crypto_pbkdf2 = util.promisify(crypto.pbkdf2);

const ITERATIONS = 1000;
const SALT = config.get("app.salt");

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

function convert(row) {
    return {
        user_id: row.user_id,
        created_at: new Date(row.created_ms),
        email: row.email,
        password_hash: row.password_hash,
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
    password_hash=null,
    now_ms=Date.now(),
}) {
    const statement = sqlite.prepare(
        `INSERT INTO users (
            created_ms,
            email,
            password_hash,
            updated_ms
         ) VALUES (
            :created_ms,
            :email,
            :password_hash,
            :updated_ms
        )`
    );
    statement.run({
        email,
        password_hash,
        created_ms: now_ms,
        updated_ms: now_ms,       
    });
    return get_by_email(sqlite, email);
}

exports.create = create;
exports.get_by_email = get_by_email;
exports.get_by_id = get_by_id;
exports.hash_password = hash_password;
