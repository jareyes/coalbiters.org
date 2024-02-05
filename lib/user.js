const database = require("./database");

function create({user_id, email, unsubscribed}) {
  return new User(user_id, email, unsubscribed);
}

class User {
  constructor(user_id, email, unsubscribed=false) {
    this.user_id = user_id;
    this.email = email;
    this.unsubscribed = unsubscribed;
  }

  async save() {
    const result = await database.query(
     "INSERT INTO users (email, unsubscribed) VALUES (?, ?) on DUPLICATE KEY UPDATE email=VALUES(email), unsubscribed=VALUES(unsubscribed)",
     [this.email, this.unsubscribed],
   );
    const user = await User.get_by_email(this.email);
    Object.assign(this, user);
    return true;
  }

  static async get_by_email(email) {
    const rows = await database.query(
      "select * from users where email=?",
      [email],
    );

    if(rows.length < 1) {
      return null;
    }
    const user = create(rows[0]);
    return user;
  }

  static create(email) {
    return new User(undefined, email, undefined, undefined);
  }
}

module.exports = User;
