const config = require("config");
const mysql = require("mysql2");

const MYSQL_CONFIG = config.get("mysql");

let POOL = null;

async function connect() {
  POOL = await mysql.createPool(MYSQL_CONFIG).promise();
  await POOL.query("SET time_zone=\"+00:00\"");
  return true;
}

function close() {
  if(POOL !== null) {
    POOL.end();
    POOL = null;
  }
  return true;
}

async function query(statement, values) {
  const [rows] = await POOL.query(statement, values);
  return rows;
}

exports.connect = connect;
exports.close = close;
exports.query = query;
