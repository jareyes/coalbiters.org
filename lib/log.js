const config = require("config");
const process = require("node:process");
const os = require("node:os");

const LEVEL_NAME = config.get("log.level");
const LEVELS = {
    debug: 10,
    info: 20,
    error: 30,
    silent: 40,
};
const LEVEL_NAMES = {
    10: "debug",
    20: "info",
    30: "error",
    40: "silent"
};

const HOSTNAME = os.hostname();
const PID = process.pid;

if(LEVELS[LEVEL_NAME] === undefined) {
    throw new RangeError(`Log level must be one of debug, info, error, or slient. Received ${LEVEL_NAME}`);
}

const LOG_LEVEL = LEVELS[LEVEL_NAME];

function serialize_array(arr) {
    const record = [];
    for(const value of arr) {
	    record.push(serialize(value));
    }
    return record;
}

function serialize_object(obj) {
    const entries = Object.entries(obj);
    const record = {};
    for(const [key, value] of entries) {
	    if(value === undefined) {
	        continue;
	    }
	    record[key] = serialize(value);
    }
    return record;
}

function serialize_error(err) {
    return {
	    message: err.message,
	    stack: err.stack,
	    ...serialize_object(err),
    };
}

function serialize_date(date) {
    return date.toISOString();
}

function serialize(value) {
    if(value === null || value === undefined) {
	    return value;
    }
    if(Array.isArray(value)) {
	    return serialize_array(value);
    }
    else if(value instanceof Error) {
	    return serialize_error(value);
    }
    else if(value instanceof Date) {
	    return serialize_date(value);
    }
    else if(value.constructor === Object) {
	    return serialize_object(value);
    }
    
    return value;
}

function log_object(obj, level, now=new Date()) {
    if(level < LOG_LEVEL) {
	    return;
    }
    
    const record = {
	    level: LEVEL_NAMES[level],
	    time: now.toISOString(),
	    hostname: HOSTNAME,
	    pid: PID,
	    ...serialize_object(obj),
    };
    const message = JSON.stringify(record);
    const log = (level === LEVELS.error)? console.error : console.log;
    log(message);
}

function debug(msg) {
    log_object(msg, LEVELS.debug);
}

function info(msg) {
    log_object(msg, LEVELS.info);
}

function error(msg) {
    log_object(msg, LEVELS.error);
}

function profile(logger, msg, start_ms) {
    const time_ms = Date.now() - start_ms;
    logger({...msg, time_ms});
}

class Profiler {
    constructor() {
        this.start_ms = Date.now();
    }

    debug(msg) {
        profile(debug, msg, this.start_ms);
    }

    info(msg) {
        profile(info, msg, this.start_ms);
    }

    error(msg) {
        profile(error, msg, this.start_ms);
    }
}

exports.debug = debug;
exports.info = info;
exports.error = error;
exports.Profiler = Profiler;
