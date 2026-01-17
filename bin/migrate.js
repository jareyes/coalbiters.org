#!/usr/bin/env node
const config = require("config");
const fs = require("node:fs");
const log = require("../lib/log");
const path = require("node:path");
const process = require("node:process");
const {DatabaseSync} = require("node:sqlite");

const SQLITE_FILEPATH = config.get("sqlite.filepath");
const MIGRATIONS_DIRPATH = path.join(__dirname, "..", "migrations");

const CREATE_MIGRATIONS_TABLE_QUERY = `
CREATE TABLE IF NOT EXISTS migrations (
   migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
   filename TEXT NOT NULL,
   applied_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000),
   UNIQUE(filename)
)`;
const INSERT_MIGRATION_QUERY =`
INSERT INTO migrations (filename) VALUES (:filename)
`;
const COUNT_MIGRATION_QUERY = `
SELECT COUNT(*) AS count FROM migrations WHERE filename=:filename
`;

function already_applied(sqlite, filename) {
    const {count} = sqlite.
        prepare(COUNT_MIGRATION_QUERY).
        get({filename});
    return (count > 0);
}

function apply(sqlite, query, filename, will_ignore) {
    // Skip previously applied migrations
    if(already_applied(sqlite, filename)) {
        log.info({
            event: "Migrate.SKIP",
            filename,
        });
        return;
    }

    // Apply the migration!
    try {
        // In a transaction
        sqlite.exec("BEGIN TRANSACTION");
        sqlite.exec(query);
        // Record the application
        sqlite.
            prepare(INSERT_MIGRATION_QUERY).
            run({filename});
        sqlite.exec("COMMIT");
        log.info({
            event: "Migrate.MIGRATE",
            filename,
        });
    }
    catch(err) {
        sqlite.exec("ROLLBACK");
        err.filename = filename;
        throw err;
    }
}

async function migrate(
    sqlite,
    dirpath=MIGRATIONS_DIRPATH,
) {
    const filenames = await fs.promises.readdir(dirpath);
    // Apply migrations in lexigraphical order
    filenames.sort();

    // Create migrations table if needed
    sqlite.exec(CREATE_MIGRATIONS_TABLE_QUERY);
    for(const filename of filenames) {
        if(!filename.endsWith(".sql")) {
            continue;
        }
        // TODO: Use @acme/lib/file.readdir()
        const filepath = path.join(dirpath, filename);
        const query = await fs.promises.readFile(
            filepath,
            "utf-8",
        );
        await apply(sqlite, query, filename);
    }
}

if(require.main === module) {
    const flags = [];
    const args = [];
    for(const arg of process.argv.slice(2)) {
        const bin = arg.startsWith("-")? flags : args;
        bin.push(arg);            
    }
    // Help text
    if(
        flags.includes("-h") ||
        flags.includes("--help")
    ) {
        console.log("Usage: migrate.js [migration directory]");
        process.exit();
    }
    const dirpath = args[0];
    const sqlite = new DatabaseSync(SQLITE_FILEPATH);

    // Let's migrate! But also clean up system resources
    // once we're done
    (async () => {
        try {
            await migrate(sqlite, dirpath);
        }
        finally {
            sqlite.close();
        }
    })();
}

module.exports = migrate;
