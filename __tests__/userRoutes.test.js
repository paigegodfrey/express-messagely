const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const {
  ensureLoggedIn,
  ensureCorrectUser
} = require('../middleware/auth');


describe("User Routes Test", function () {
  const u1Username = "test1";
  const u2Username = "test2";
  let u1Token;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let response = await request(app)
      .post("/auth/register")
      .send({
        username: u1Username,
        password: "password",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14150000000"
      });

    u1Token = response.body.token;

    u2 = await User.register({
      username: u2Username,
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155559999",
    });

    m1 = await Messages.create({
      from_username: "test2",
      to_username: "test1",
      body: "test message"
    });
  });

  describe('GET /users'), function () {
    it("gets list of all users", async function () {
      let response = await request(app)
        .get("/users")
        .send({ _token: u1Token });
      expect(response).toEqual({
        users: [
          {
            username: u1Username,
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14150000000"
          },
          {
            username: u2Username,
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155559999"
          }
        ]
      });
    }



});