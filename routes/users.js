const express = require('express');
const User = require('../models/user');
const {
  ensureLoggedIn,
  ensureCorrectUser
} = require('../middleware/auth');

const router = express.Router();
/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async (req, res, next) => {
  let users = await User.all();
  return res.json({ users });
});


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get(
  '/:username',
  ensureLoggedIn, ensureCorrectUser,
  async (req, res, next) => {
    let username = req.params.username;
    let user = await User.get(username);

    return res.json({ user });
  });


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get(
  '/:username/to',
  ensureLoggedIn, ensureCorrectUser, 
  async (req, res) => {
    let username = req.params.username;
    let messagesTo = await User.messagesTo(username);
    return res.json({ messages: messagesTo });
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get(
  '/:username/from',
  ensureLoggedIn, ensureCorrectUser, 
  async (req, res) => {
    let username = req.params.username;
    let messagesFrom = await User.messagesFrom(username);
    return res.json({ messages: messagesFrom });
})

module.exports = router;