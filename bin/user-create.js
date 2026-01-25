#!/usr/bin/env node
const config = require("config");
const process = require("node:process");
const {DatabaseSync} = require("node:sqlite");
const User = require("../lib/model/user");

const SQLITE_FILEPATH = config.get("sqlite.filepath");

async function create_user(sqlite, email, password) {
    const password_hash = await User.hash_password(password);
    User.create(sqlite, {
        email,
        password_hash,
    });
}

if(require.main === module) {
    const argv = process.argv.slice(2);
    if(argv.length < 2) {
        console.log("Usage: user-create.js <email> <password>");
        process.exit(1);
    }
    const sqlite = new DatabaseSync(SQLITE_FILEPATH);
    const [email, password] = argv;
    (async () => {
        try {
            await create_user(sqlite, email, password);
            console.log(`Added ${email}.`);
        }
        finally {
            sqlite.close();
        }
    })();
}
