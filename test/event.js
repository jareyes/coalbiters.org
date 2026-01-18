const assert = require("node:assert/strict");
const Event = require("../lib/model/event");
const migrate = require("../bin/migrate");
const {DatabaseSync} = require("node:sqlite");
const {suite, test} = require("node:test");

async function create_sqlite() {
    const sqlite = new DatabaseSync(":memory:");
    await migrate(sqlite);
    return sqlite;
}

suite("/lib/model/event.js", () => {
    test.todo("Can save an event");
    test.todo("Can get an event by id");
    test.todo("Can get an event by slug");
});
