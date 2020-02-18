const express = require('express');
const User = require('../models/user');
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require('../expressError');

const router = express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    let isValidUser = await User.authenticate(username, password);

    if (!isValidUser) {
      throw new ExpressError(`Username/password is not valid`, 400);
    } else {
      await User.updateLoginTimestamp(username);
      let payload = { username, iat: Date.now()};
      let token = jwt.sign(payload, SECRET_KEY);
      
      return res.json({ token });
    }
  }
  
  catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

 router.post('/register', async (req, res, next) => {
  try {

    const { username, password, first_name, last_name, phone } = req.body;

    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError("Please input information for all required fields.", 400)
    }

    let newUser = await User.register({ username, password, first_name, last_name, phone });

    if (!newUser) {
      throw new ExpressError("Username already exists", 400)
    }

    await User.updateLoginTimestamp(username);
    let payload = { username, iat: Date.now()};
    let token = jwt.sign(payload, SECRET_KEY);
    return res.json({ token });
  }

  catch (err) {
    return next(err);
  }
});

module.exports = router;