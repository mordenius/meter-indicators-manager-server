import { verify } from "jsonwebtoken";
import { Types } from "mongoose";

import { startApp, stopApp, dropCollection, getLogger } from "./__helpers__";

import { User, UserDocument, UserInDto } from "../user.entity";
import { UsersService } from "../users.service";
import { Session, SessionDocument } from "../session.entity";
import { AuthService, LoginDto } from "../auth.service";

beforeAll(
  async (): Promise<void> => {
    await startApp();
    await dropCollection<SessionDocument>(Session);
    await dropCollection<UserDocument>(User);
  }
);

afterAll(
  async (): Promise<void> => {
    await dropCollection<SessionDocument>(Session);
    await dropCollection<UserDocument>(User);
    await stopApp();
  }
);

const TEST_USER_EMAIL = "test@test.com";

describe("Authentication service", () => {
  it(`should the collection be empty
   before testing`, async (): Promise<void> => {
    const sessions = await Session.find({});
    expect(sessions.length).toEqual(0);
  });

  it("should register a new user", async () => {
    const userService = new UsersService(User, getLogger());

    const spy = jest.spyOn(userService, "create");

    const authService = new AuthService(userService, Session, getLogger());

    const data: UserInDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty"
    };
    const user = await authService.registration(data);

    expect(user.email).toBe(data.email);
    expect((user as any).pswd).toBeUndefined();
    expect(spy).toBeCalled();
    expect(spy.mock.calls).toEqual([[data]]);
  });

  it("should login an exist user", async () => {
    const userService = new UsersService(User, getLogger());

    const spy = jest.spyOn(userService, "comparePassword");

    const authService = new AuthService(userService, Session, getLogger());

    const data: LoginDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty",
      userAgent: "fake_user_agent"
    };
    const { accessToken, refreshToken } = await authService.login(data);

    const accessTokenPayload = verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY as string
    );
    const refreshTokenPayload = verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY as string
    );

    expect(accessTokenPayload.session).toBe(refreshTokenPayload.session);
    expect(accessTokenPayload.user).toBe(refreshTokenPayload.user);
    expect(spy).toBeCalled();
    expect(spy.mock.calls).toEqual([[{ email: data.email, pswd: data.pswd }]]);

    const session = await Session.findById(accessTokenPayload.session);

    expect(session?.userAgent).toBe(data.userAgent);
    expect(session?.accessToken).toBe(accessToken);
    expect(session?.refreshToken).toBe(refreshToken);

    const user = await User.findById(accessTokenPayload.user);

    expect(user?.email).toBe(data.email);
    expect(user?._id.toString()).toBe(session?.user.toString());
  });

  it("should refresh tokens", async () => {
    const userService = new UsersService(User, getLogger());
    const authService = new AuthService(userService, Session, getLogger());

    const data: LoginDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty",
      userAgent: "fake_user_agent"
    };
    const { accessToken, refreshToken } = await authService.login(data);

    const accessTokenPayload = verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY as string
    );

    const session = await Session.findById(accessTokenPayload.session);

    expect(session?.userAgent).toBe(data.userAgent);
    expect(session?.accessToken).toBe(accessToken);
    expect(session?.refreshToken).toBe(refreshToken);

    const {
      accessToken: resignedAccessToken,
      refreshToken: resignedRefreshToken
    } = await authService.resignToken(refreshToken);

    const resignedSession = await Session.findById(accessTokenPayload.session);

    expect(resignedSession?._id.toString()).toBe(session?._id.toString());
    expect(resignedSession?.userAgent).toBe(data.userAgent);
    expect(resignedSession?.accessToken).toBe(resignedAccessToken);
    expect(resignedSession?.refreshToken).toBe(resignedRefreshToken);
  });

  it("should close a user session", async () => {
    const userService = new UsersService(User, getLogger());
    const authService = new AuthService(userService, Session, getLogger());

    const data: LoginDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty",
      userAgent: "fake_user_agent"
    };
    const { accessToken, refreshToken } = await authService.login(data);

    const accessTokenPayload = verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY as string
    );

    const session = await Session.findById(accessTokenPayload.session);

    expect(session?.userAgent).toBe(data.userAgent);
    expect(session?.accessToken).toBe(accessToken);
    expect(session?.refreshToken).toBe(refreshToken);

    await authService.logout(accessTokenPayload.session);

    const closedSession = await Session.findById(accessTokenPayload.session);

    expect(closedSession).toBeNull();
  });

  it("should throw an error when trying to close a user session that does not exist", async () => {
    const userService = new UsersService(User, getLogger());
    const authService = new AuthService(userService, Session, getLogger());

    const FAKE_SESSION_ID = new Types.ObjectId().toString();

    try {
      await authService.logout(FAKE_SESSION_ID);
      expect(true).toBeFalsy();
    } catch (err) {
      expect((err as any).message).toMatch("Active session not found");
    }
  });
});
