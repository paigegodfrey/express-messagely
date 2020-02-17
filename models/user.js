/** User class for message.ly */
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);
    await db.query(
      `INSERT INTO users (username, hashedPassword, first_name, last_name, phone)
              VALUES ($1, $2, $3, $4, $5)`,
      [username, hashedPassword, first_name, last_name, phone]);
    return { username, hashedPassword, first_name, last_name, phone };
  };

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]);
    const user = result.rows[0];

    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(
      `UPDATE users SET last_login_at=current_timestamp WHERE username = $1
        RETURNING username, last_login_at`,
      [username]);

    const user = result.rows[0];

    if (!user) {
      throw new ExpressError(`User does not exist: ${username}`, 404);
    }
    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
        FROM users`
    );
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
        FROM users WHERE username = $1`, [username]
    );
    return result.rows[0];
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const messageResult = await db.query(
      `SELECT id, to_username as to_user, body, sent_at, read_at 
        FROM messages WHERE from_username = $1`, [username]
    );
    const messages = messageResult.rows;
    let idx = 0;
    for(let message of messages) {
      let toUser = message.to_user;
      let toUserResult = await db.query(
        `SELECT username, first_name, last_name, phone 
          FROM users WHERE username = $1`, [toUser]
      );
      toUser = toUserResult.rows[0];
      message.to_user = toUser;
      messages[idx] = message;
      idx++;
    }
    return messages;
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;