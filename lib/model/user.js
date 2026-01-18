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
    const user = convert(row);
    return user;
}

function create(sqlite, {
    email,
    now_ms=Date.now(),
}) {
    const statement = sqlite.exec(
        "INSERT INTO users (created_ms, email, updated_ms) VALUES (:created_ms, :email, :updated_ms)",
        {
            email,
            created_ms: now_ms,
            update_ms: now_ms,       
        },
    );
    return get_by_email(sqlite, email);
}

exports.get_by_email = get_by_email;
