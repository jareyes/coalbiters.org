const assert = require("node:assert/strict");
const migrate = require("../bin/migrate");
const {DatabaseSync} = require("node:sqlite");
const {suite, test} = require("node:test");
const User = require("../lib/model/user");

async function create_sqlite() {
    const sqlite = new DatabaseSync(":memory:");
    await migrate(sqlite);
    return sqlite;
}

suite("/lib/model/user.js", () => {
    test.todo("Can save a user");
    test.todo("Can get a user by email");
});
