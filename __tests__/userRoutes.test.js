const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Message = require("../models/message");


describe("User Routes Test", function () {
  const u1Username = "test1";
  const u2Username = "test2";
  let u1Token;
  let u2Token;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1Response = await request(app)
      .post("/auth/register")
      .send({
        username: u1Username,
        password: "password",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14150000000"
      });

    u1Token = u1Response.body.token;

    let u2Response = await request(app)
      .post("/auth/register")
      .send({
      username: u2Username,
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155559999",
    });

    u2Token = u2Response.body.token;

    let m1 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "test message"
    });
  });

  describe('GET /users', function () {
    it("gets list of all users", async function () {
      let response = await request(app)
        .get("/users")
        .send({
          _token: u1Token
        });


      expect(response.body).toEqual({
        users: [{
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
    });

    it('returns authorized error if user is not logged in', async () => {
      // No token sent with request
      let response = await request(app)
        .get(`/users/${u1Username}`);
      expect(response.statusCode).toBe(401);
    });

  });

  describe('GET /user/:username', () => {
    it('gets details of valid user', async () => {
      let response = await request(app)
        .get(`/users/${u1Username}`)
        .send({
          _token: u1Token
        });

      expect(response.body).toEqual({
        user: {
          username: u1Username,
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14150000000",
          join_at: expect.any(String),
          last_login_at: expect.any(String)
        }
      })
    })

    it('returns authorized error if user is not logged in', async () => {
      // No token sent with request
      let response = await request(app)
        .get(`/users/${u1Username}`);
      expect(response.statusCode).toBe(401);
    });

    it('returns unauthorized error if logged in user doesn\'t match user we get details from', async () => {
      // u1 token sent to request user details of u2
      let response = await request(app)
        .get(`/users/${u2Username}`)
        .send({
          _token: u1Token
        });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /:username/to', () => {
    it("should get messages to user <username>", async () => {
      let response = await request(app)
        .get(`/users/${u1Username}/to`)
        .send({
          _token: u1Token
        });
      expect(response.body).toEqual({
        messages: [{
          id: expect.any(Number),
          body: "test message",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: u2Username,
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155559999"
          }
        }]
      });
    });

    it('returns authorized error if user is not logged in', async () => {
      // No token sent with request
      let response = await request(app)
        .get(`/users/${u1Username}/to`);
      expect(response.statusCode).toBe(401);
    });

    it('returns unauthorized error if logged in user doesn\'t match user we get messages to', async () => {
      // u2 token sent to request messages to user u1
      let response = await request(app)
        .get(`/users/${u1Username}/to`)
        .send({
          _token: u2Token
        });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /:username/from', () => {
    it("should get messages from user <username>", async () => {
      let response = await request(app)
        .get(`/users/${u2Username}/from`)
        .send({
          _token: u2Token
        });
      expect(response.body).toEqual({
        messages: [{
          id: expect.any(Number),
          body: "test message",
          sent_at: expect.any(String),
          read_at: null,
          to_user: {
            username: u1Username,
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14150000000"
          }
        }]
      });
    });

    it('returns authorized error if user is not logged in', async () => {
      // No token sent with request
      let response = await request(app)
        .get(`/users/${u2Username}/from`);
      expect(response.statusCode).toBe(401);
    });

    it('returns unauthorized error if logged in user doesn\'t match user we get messages from', async () => {
      // u1 token sent to request messages from u2 
      let response = await request(app)
        .get(`/users/${u2Username}/from`)
        .send({
          _token: u1Token
        });
      expect(response.statusCode).toBe(401);
    });
  });


});

afterAll(async function () {
  await db.end();
});