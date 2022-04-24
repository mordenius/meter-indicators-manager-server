import {
  startApp,
  stopApp,
  request,
  Method,
  dropCollection
} from "./__helpers__";

import { Session } from "../users/session.entity";
import { User } from "../users/user.entity";

beforeAll(async function(): Promise<void> {
  await startApp();
  await dropCollection(Session);
  await dropCollection(User);
});

afterAll(async function(): Promise<void> {
  await dropCollection(Session);
  await dropCollection(User);
  await stopApp();
});

describe("Authentication API", function() {
  it("should register user", async (): Promise<void> => {
    const response = await request<{ message: string }>(
      {
        path: `/registration`,
        method: Method.POST
      },
      JSON.stringify({ email: "test@test.com", pswd: "qwerty" })
    );

    expect(response.statusCode).toBe(200);
    expect(typeof response.body.message === "string").toBeTruthy();
  });

  let token: string;

  it("should login user", async (): Promise<void> => {
    const response = await request<{ message: string; accessToken: string }>(
      {
        path: `/login`,
        method: Method.POST
      },
      JSON.stringify({ email: "test@test.com", pswd: "qwerty" })
    );

    token = response.body.accessToken;

    expect(response.statusCode).toBe(200);
    expect(typeof response.body.message === "string").toBeTruthy();
    expect(typeof response.body.accessToken === "string").toBeTruthy();
  });

  it("should logout user", async (): Promise<void> => {
    const response = await request<{ message: string }>(
      {
        path: `/logout`,
        method: Method.POST,
        cookie: `accessToken=${token}`
      },
      JSON.stringify({ })
    );

    expect(response.statusCode).toBe(200);
    expect(typeof response.body.message === "string").toBeTruthy();
  });
});
