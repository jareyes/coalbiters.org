"use strict";

function assign_helper(name, value, opts) {
  if(opts.data.root === undefined) {
    opts.data.root = {};
  }
  opts.data.root[name] = value;
}

function block_helper(name, opts) {
  if(opts.data.root === undefined) {
    opts.data.root = {};
  }
  opts.data.root[name] = opts.fn(this);
}

function pad(number, fill="0", width=2) {
  return number.toString().padStart(width, fill);
}

function ical_format_helper(date) {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());

  return `${year}${month}${day}T${hour}${minute}00Z`;
}

exports.assign = assign_helper;
exports.block = block_helper;
exports.ical_format = ical_format_helper;
