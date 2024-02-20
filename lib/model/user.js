const database = require("../database");

function create({user_id, email}) {
  return new User(user_id, email);
}

class User {
  constructor(user_id, email) {
    this.user_id = user_id;
    this.email = email;
  }

  async save() {
    const result = await database.query(
     "insert into users (email) values (?) on duplicate key update email=email",
     [this.email],
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

  static async get_by_id(user_id) {
    const rows = await database.query(
      "SELECT * FROM users WHERE user_id=?",
      [user_id],
    );
    if(rows.length < 1) {
      throw new RangeError(`No user with ID: ${user_id}`);
    }
    const user = create(rows[0]);
    return user;
  }

  static create(email) {
    return new User(undefined, email, undefined, undefined);
  }
}

module.exports = User;
