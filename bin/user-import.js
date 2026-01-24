#!/usr/bin/env node
const config = require("config");
const process = require("node:process");
const readline = require("node:readline/promises");
const {DatabaseSync} = require("node:sqlite");

const SQLITE_FILEPATH = config.get("sqlite.filepath");

async function main(sqlite, filepath) {
    const lines = readline.createInterface({
        input: process.stdin,
    });
    const statement = sqlite.prepare("INSERT INTO users (user_id, email, created_ms) VALUES (:user_id, :email, :created_ms)");
    for await(const line of lines) {
        const [user_id, email, joined_at] = line.split("\t");
        const created_ms = Date.parse(`${joined_at}Z`);
        const parameters = {user_id, email, created_ms};
        statement.run(parameters);
        console.log(`Added ${email}`);
    }
}

if(require.main === module) {
    const sqlite = new DatabaseSync(SQLITE_FILEPATH);
    (async () => {
        try {
            await main(sqlite);
        }
        finally {
            sqlite.close();
        }
    })();
}
