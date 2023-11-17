const {create: hbs} = require("express-handlebars");
const helpers = require("./helpers");
const path = require("node:path");

const HBS = hbs({
  extname: "hbs",
  defaultLayout: "base",
  helpers,
});

/* async */ function render(template_name, locals) {
  const view_path = path.join(
    __dirname,
    "..",
    "views/",
    `${template_name}.hbs`,
  );
  return HBS.engine(view_path, locals)
}

exports.render = render;
exports.engine = HBS.engine;
