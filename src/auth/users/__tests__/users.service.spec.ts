import { startApp, stopApp, dropCollection, getLogger } from "./__helpers__";

import { User, UserDocument, UserInDto } from "../user.entity";
import { UsersService } from "../users.service";

beforeAll(
  async (): Promise<void> => {
    await startApp();
    await dropCollection<UserDocument>(User);
  }
);

afterAll(
  async (): Promise<void> => {
    await dropCollection<UserDocument>(User);
    await stopApp();
  }
);

const TEST_USER_EMAIL = "test@test.com";

describe("Users Service", (): void => {
  it(`should the collection be empty
   before testing`, async (): Promise<void> => {
    const users = await User.find({});
    expect(users.length).toEqual(0);
  });

  it("should create a new user", async (): Promise<void> => {
    const usersService = new UsersService(User, getLogger());

    const data: UserInDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty"
    };

    const user = await usersService.create(data);

    expect(user.email).toBe(data.email);
    expect((user as any).pswd).toBeUndefined();
  });

  it(`should throw an error while trying
   to create a new user 
   with an already exist email`, async (): Promise<void> => {
    const usersService = new UsersService(User, getLogger());

    const data: UserInDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty"
    };

    try {
      await usersService.create(data);
      expect(true).toBeFalsy();
    } catch (err) {
      expect((err as any)?.message).toMatch(
        "User with email test@test.com already exist."
      );
    }
  });

  it("should find a user by email", async (): Promise<void> => {
    const usersService = new UsersService(User, getLogger());

    const data: UserInDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty"
    };

    const user = await usersService.getByEmail(data.email as string);

    if (!user) {
      expect(true).toBeFalsy();
    }

    expect(user).not.toBeNull();
    expect(user).toBeDefined();
    expect(user.email).toBe(data.email);
    expect((user as any).pswd).toBeUndefined();
  });

  it("should hide password while find a user by email", async (): Promise<
    void
  > => {
    const usersService = new UsersService(User, getLogger());

    const data: UserInDto = {
      email: TEST_USER_EMAIL,
      pswd: "qwerty"
    };

    const user = await usersService.getByEmail(data.email as string);

    expect((user as any).pswd).toBeUndefined();
  });

  it(`should throw an error
   when a user by email not found`, async (): Promise<void> => {
    const usersService = new UsersService(User, getLogger());

    const FAKE_EMAIL = "not_exist_user_email@test.com";

    try {
      const user = await usersService.getByEmail(FAKE_EMAIL);
      expect(true).toBeFalsy();
    } catch (err) {
      expect((err as any)?.message).toMatch(
        `User with email ${FAKE_EMAIL} not found`
      );
    }
  });
});
