"use strict";
const MS_PER_MINUTE = 1000 * 60;
const DISPLAY_DATERANGEFORMAT = new Intl.DateTimeFormat(
  "en-US",
  {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "America/New_York",
  },
);

const HOUR_FORMAT = new Intl.DateTimeFormat(
  "en-US",
  {
    hour: "numeric",
    minute: "numeric",
    timeZone: "America/New_York",
  },
);

const HUMANIZED_DATEFORMAT = new Intl.DateTimeFormat(
  "en-US",
  {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "America/New_York",
  },
);

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

function ical_date_helper(date) {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());

  return `${year}${month}${day}T${hour}${minute}00Z`;
}

function iso_date_helper(date) {
  return date.toISOString();
}

function format_hour(hour, minute) {
  return `${hour}${(minute === "00")? "" : minute}`;
}

function display_daterange_helper(start_date, end_date) {    
  // Start time
  const parts = DISPLAY_DATERANGEFORMAT.formatToParts(start_date);
  const weekday = parts[0].value;
  const month = parts[2].value;
  const day = parts[4].value;
  const start_hour = parts[6].value;
  const start_minute = parts[8].value;
  const start_period = parts[10].value;

  // End time
  const end_parts = HOUR_FORMAT.formatToParts(end_date);
  const end_hour = end_parts[0].value;
  const end_minute = end_parts[2].value;
  const end_period = end_parts[4].value;

  const start_time = format_hour(start_hour, start_minute);
  const end_time = format_hour(end_hour, end_minute);

  let time_range = `${start_time}-${end_time} ${start_period}`;
  if(start_period !== end_period) {
    time_range = `${start_time} ${start_period}-${end_time} ${end_period}`;
  }

  return `${weekday}, ${month}. ${day} ${time_range}`;
}

function humanized_date_helper(date) {
  return HUMANIZED_DATEFORMAT.format(date);
}

function strip_html_helper(html) {
  return html.replace(/(<([^>]+)>)/ig, "");
}

function convert_usd(cents) {
    if(cents === 0) {
        return "free";
    }
    const amount_usd = cents / 100;
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
        },
    ).format(amount_usd);
}

function get_hour(date, timezone) {
    const parts = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: timezone,
            hour: "numeric",
            hour12: true
        },
    ).formatToParts(date);
    const hour = parts.find(part => part.type === "hour");
    return hour.value;
}

function get_day_period(date, timezone) {
    const parts = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: timezone,
            hour: "numeric",
            hour12: true
        },
    ).formatToParts(date);
    const day_period = parts.find(
        part => part.type === "dayPeriod"
    );
    return day_period.value;
}

function get_weekday(date, timezone) {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: timezone,
            weekday: "long"
        },
    ).format(date);
}

function get_date(date, timezone) {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: timezone,
            month: "long",
            day: "numeric",
            year: "numeric",
        },
    ).format(date);
}

exports.amount_usd = convert_usd;
exports.assign = assign_helper;
exports.block = block_helper;
exports.day_period = get_day_period;
exports.ical_date = ical_date_helper;
exports.iso_date = iso_date_helper;
exports.display_daterange = display_daterange_helper;
exports.hour = get_hour;
exports.humanized_date = humanized_date_helper;
exports.strip_html = strip_html_helper;
exports.weekday = get_weekday;
exports.date = get_date;
