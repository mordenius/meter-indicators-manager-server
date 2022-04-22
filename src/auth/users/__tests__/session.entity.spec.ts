import { Types } from "mongoose";
import { Session, SessionInDto } from "./../session.entity";

import { startApp, stopApp, dropCollection } from "./__helpers__";

beforeAll(
  async (): Promise<void> => {
    await startApp();
    await dropCollection(Session);
  }
);

afterAll(
  async (): Promise<void> => {
    await dropCollection(Session);
    await stopApp();
  }
);

describe("Session entity", (): void => {
  it(`should the collection be empty
   before testing`, async (): Promise<void> => {
    const sessions = await Session.find();
    expect(sessions.length).toEqual(0);
  });

  it("should create a session", async (): Promise<void> => {
    const data: SessionInDto = {
      accessToken: "fake_access_token",
      refreshToken: "fake_refresh_token",
      userAgent: "fake_user_agent",
      user: new Types.ObjectId().toString()
    };

    const session = await Session.create(data);

    expect(session._id).toBeInstanceOf(Types.ObjectId);
    expect(session.accessToken).toBe(data.accessToken);
    expect(session.refreshToken).toBe(data.refreshToken);
    expect(session.userAgent).toBe(data.userAgent);
    expect(session.user.toString()).toBe(data.user);
    expect(session.createdAt).not.toBeUndefined();
  });
});
