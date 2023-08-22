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

exports.assign = assign_helper;
exports.block = block_helper;
