import { Model, ObjectId } from "mongoose";

import {
  Logger,
  Tool,
  LOGGER_TOOL_NAME,
  DataSourceErrorCode
} from "../_frameworks";

import {
  UserDocument,
  USER_MODEL_NAME,
  UserInDto,
  UserOutDto
} from "./user.entity";

export class UsersService {
  private readonly repository: Model<UserDocument>;

  constructor(
    @Tool(USER_MODEL_NAME) model: Model<UserDocument>,
    @Tool(LOGGER_TOOL_NAME) private readonly logger: Logger
  ) {
    this.repository = model;
  }

  async create({ email, pswd }: UserInDto): Promise<UserOutDto> {
    let user: UserDocument;

    try {
      user = await this.repository.create({ email, pswd });
    } catch (err) {
      if (
        (err as any).code === DataSourceErrorCode.DUPLICATE_KEY &&
        (err as any).keyPattern.email
      ) {
        this.logger.warn(
          `Trying to create user with the email that already in use: ${email}`
        );
        throw new Error(`User with email ${email} already exist.`);
      }

      throw err;
    }

    await user.save();

    user.pswd = undefined;
    return user;
  }

  async getById(id: ObjectId): Promise<UserDocument> {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    return user;
  }

  async getByEmail(email: string): Promise<UserDocument> {
    const user = await this.repository.findOne({ email });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return user;
  }

  async comparePassword({ email, pswd }: UserInDto): Promise<ObjectId> {
    const user = await this.repository.findOne({ email }).select("pswd");

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    if (user.pswd === pswd) {
      return user._id;
    }

    throw new Error("Wrong credentials");
  }
}
