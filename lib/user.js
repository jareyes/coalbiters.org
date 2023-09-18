const database = require("./database");

function create({user_id, email, date_joined, is_confirmed}) {
  return new User(user_id, email, date_joined, is_confirmed);
}

async function insert(user) {
  const result = await database.query(
    "insert into users (email) values (?)",
    [user.email],
  );
  return result;
}

function update(user) {

}

class User {
  constructor(user_id, email, date_joined, is_confirmed) {
    this.user_id = user_id;
    this.email = email;
    this.date_joined = date_joined;
    this.is_confirmed = is_confirmed;
  }

  /* async */ save() {
    if(this.user_id === null) { return insert(this); }
    return update(this);
  }

  static async get_by_email(email) {
    const [row] = await database.query(
      "select * from users where email=?",
      [email],
    );
    const user = create(row);
    return user;
  }
}

module.exports = User;
