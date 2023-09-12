class User {
  constructor(user_id, email, is_confirmed) {
    this.user_id = user_id;
    this.email = email;
    this.is_confirmed = is_confirmed;
  }
}

module.exports = User;
