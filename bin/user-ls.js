#!/usr/bin/env node
const config = require("config");
const process = require("node:process");
const {DatabaseSync} = require("node:sqlite");

function format(row) {
    return [
        row.email,
        new Date(row.created_ms)
    ].join("\t");
}

function main(sqlite) {
    const statement = sqlite.prepare(
        "SELECT * FROM users",
    );
    const rows = statement.all();
    for(const row of rows) {
        console.log(format(row));
    }
}

if(require.main === module) {
    const filepath = config.get("sqlite.filepath");
    const sqlite = new DatabaseSync(filepath);
    try {
        main(sqlite);
    }
    finally {
        sqlite.close();
    }
}
