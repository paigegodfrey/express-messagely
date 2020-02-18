const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Message = require("../models/message");


describe("User Routes Test", function () {
  const u1Username = "test1";
  const u2Username = "test2";
  let u1Token;
  let u2Token;
  let m1;

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

    m1 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "test message"
    });
  });

  describe('GET /messages/:id', () => {
    it('should return detail of message', async () => {
      let response = await request(app)
        .get(`/messages/${m1.id}`)
        .send({
          _token: u1Token
        })
      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          body: "test message",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: u2Username,
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155559999"
          },
          to_user: {
            username: u1Username,
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14150000000"
          }
        }
      });
    });

    it('returns unauthorized error if logged in user is not the from_user or to_user', async () => {
      let u3Response = await request(app)
        .post("/auth/register")
        .send({
          username: "test3",
          password: "password",
          first_name: "Test3",
          last_name: "Testy3",
          phone: "+14155558888",
        });

      u3Token = u3Response.body.token;

      let response = await request(app)
        .get(`/messages/${m1.id}`)
        .send({
          _token: u3Token
        });
      expect(response.statusCode).toBe(401);
    });

  });

  describe('POST /messages/', () => {
    it('if valid body, should post a message from user 1 to user 2', async () => {
      let response = await request(app)
        .post('/messages')
        .send({
          _token: u1Token,
          to_username: u2Username,
          body: "testing"
        })

      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          from_username: u1Username,
          to_username: u2Username,
          body: "testing",
          sent_at: expect.any(String)
        }
      });
    });

    it('if invalid body then should return a bad request error', async () => {
      let response = await request(app)
        .post('/messages')
        .send({
          _token: u1Token
        })
      expect(response.statusCode).toBe(400);
    });

    it('returns unauthorized error if user is not logged in', async () => {
      // No token sent with request
      let response = await request(app)
        .post('/messages')
        .send({
          to_username: u2Username,
          body: "testing"
        });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /:id/read', () => {
    it('should mark message as read if intended recipient marks as read', async () => {
      let response = await request(app)
        .post(`/messages/${m1.id}/read`)
        .send({
          _token: u1Token
        });
      expect(response.body).toEqual({
        message: {
          id: m1.id,
          read_at: expect.any(String)
        }
      });
    });

    it('returns authorized error if user is not logged in', async () => {
      // No token sent with request
      let response = await request(app)
        .post(`/messages/${m1.id}/read`);
      expect(response.statusCode).toBe(401);
    });

    it('should return unauthorized if user other than intended recipient' +
      'tries to mark as read', async () => {
        let response = await request(app)
          .post(`/messages/${m1.id}/read`)
          .send({
            _token: u2Token
          });
        expect(response.statusCode).toBe(401);
      });
  });
});

afterAll(async function () {
  await db.end();
});