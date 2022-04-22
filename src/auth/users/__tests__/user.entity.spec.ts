import { User, UserInDto } from "./../user.entity";

import { startApp, stopApp, dropCollection } from "./__helpers__";

beforeAll(
  async (): Promise<void> => {
    await startApp();
    await dropCollection(User);
  }
);

afterAll(
  async (): Promise<void> => {
    await dropCollection(User);
    await stopApp();
  }
);

const TEST_USER_EMAIL = "test@test.com";

describe("User entity", (): void => {
  it(`should the collection be empty
   before testing`, async (): Promise<void> => {
    const sessions = await User.find();
    expect(sessions.length).toEqual(0);
  });

  it(`should create a new user`, async (): Promise<void> => {
    const data: UserInDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty"
    };

    const user = await User.create(data);

    expect(user.email).toBe(data.email);
    expect(user.pswd).toBe(data.pswd);
  });

  it(`should hide password while find a user`, async (): Promise<void> => {
    const user = await User.findOne({ email: TEST_USER_EMAIL });

    if (!user) {
      expect(true).toBeFalsy();
      return;
    }

    expect(user.email).toBe(TEST_USER_EMAIL);
    expect(user.pswd).toBeUndefined();
  });

  it(`should create timestamps for a document`, async (): Promise<void> => {
    const user = await User.findOne({ email: TEST_USER_EMAIL });

    if (!user) {
      expect(true).toBeFalsy();
      return;
    }

    expect(Number.isNaN(new Date("invalid").getTime())).toBeTruthy();

    expect(user.createdAt).not.toBeUndefined();
    expect(Number.isNaN(new Date(user.createdAt).getTime())).toBeFalsy();
    expect(user.updatedAt).not.toBeUndefined();
    expect(Number.isNaN(new Date(user.updatedAt).getTime())).toBeFalsy();
  });

  it(`should decline to create a user with the same email that already in use`, async (): Promise<
    void
  > => {
    const candidate = await User.findOne({ email: TEST_USER_EMAIL });

    if (!candidate) {
      expect(true).toBeFalsy();
      return;
    }

    expect(candidate.email).toBe(TEST_USER_EMAIL);

    const data: UserInDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty"
    };

    try {
      await User.create(data);
      expect(true).toBeFalsy();
    } catch (err) {
      expect((err as any).message).toMatch(
        "E11000 duplicate key error collection"
      );
    }
  });
});
