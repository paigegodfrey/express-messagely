const express = require('express');
const Message = require('../models/message');
const ExpressError = require('../expressError');
const {
  ensureLoggedIn,
  ensureCorrectUser
} = require('../middleware/auth');

const router = express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async (req, res, next) => {
  try {
    
    let currentUser = req.user.username;
    
    let messageId = req.params.id;
    let message = await Message.get(messageId);
    
    let fromUser = message.from_user.username;
    let toUser = message.to_user.username;
    
    if (!(currentUser === fromUser || currentUser === toUser)) {
      throw new ExpressError("Not authorized", 401);
    }

    return res.json({ message });
  }

  catch(err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    let fromUser = req.user.username;
    let toUser = req.body.to_username;
    let msgBody = req.body.body;
    
    if (!toUser || !msgBody){
      throw new ExpressError("Invalid Post", 400);
    }
    
    let message = await Message.create({ from_username: fromUser, to_username: toUser, body: msgBody });
    return res.json({ message });
  }

  catch(err) {
    next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
  try {

    let currentUser = req.user.username;
    
    let messageId = req.params.id;
    let message = await Message.get(messageId);
    
    let toUser = message.to_user.username;
    
    if (currentUser !== toUser) {
      throw new ExpressError("Not authorized", 401);
    }

    let messageRead = await Message.markRead(messageId);
    return res.json({message: messageRead});
  }

  catch(err) {
    next(err);
  }
});

module.exports = router;