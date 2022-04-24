import { sign, verify } from "jsonwebtoken";
import { ObjectId, Types, Model } from "mongoose";

import { Tool, LOGGER_TOOL_NAME, Logger, Inject } from "./../_frameworks";
import { SESSION_MODEL_NAME, SessionDocument } from "./session.entity";

import { UserInDto, UserOutDto } from "./user.entity";
import { UsersService } from "./users.service";

export interface LoginDto extends UserInDto {
  userAgent: string;
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly repository: Model<SessionDocument>;

  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Tool(SESSION_MODEL_NAME) model: Model<SessionDocument>,
    @Tool(LOGGER_TOOL_NAME) private readonly logger: Logger
  ) {
    this.repository = model;
  }

  async registration({ email, pswd }: UserInDto): Promise<UserOutDto> {
    return this.usersService.create({ email, pswd });
  }

  async login({ email, pswd, userAgent }: LoginDto): Promise<TokenDto> {
    const userId = await this.usersService.comparePassword({ email, pswd });

    const sessionId = new Types.ObjectId();

    const accessToken = this.signAccessToken(userId, sessionId);
    const refreshToken = this.signRefreshToken(userId, sessionId);

    const session = await this.repository.create({
      _id: sessionId,
      accessToken,
      refreshToken,
      userAgent,
      user: userId
    });

    await session.save();

    return { accessToken, refreshToken };
  }

  async logout(
    sessionId: string,
    closeAllSessions: boolean = false
  ): Promise<void> {
    const sessions = new Set();
    const session = await this.repository.findById(sessionId);

    if (!session) {
      throw new Error("Active session not found");
    }

    sessions.add(session._id);
    if (closeAllSessions) {
      for (const ses of await this.repository.find({ user: session.user })) {
        sessions.add(ses._id);
      }
    }

    await this.repository.deleteMany({ id: { $in: Array.from(sessions) } });
  }

  async resignToken(refreshToken: string): Promise<TokenDto> {
    const { user: userId, session: sessionId } = verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY as string
    );

    const sessionDocument = await this.repository.findOne({
      _id: sessionId,
      user: userId
    });

    if (!sessionDocument) {
      throw new Error("Active session not found");
    }

    const accessToken = this.signAccessToken(userId, sessionId);
    const newRefreshToken = this.signRefreshToken(userId, sessionId);

    sessionDocument.accessToken = accessToken;
    sessionDocument.refreshToken = newRefreshToken;

    await sessionDocument.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  private signAccessToken(userId: ObjectId, sessionId: Types.ObjectId): string {
    return sign(
      { user: userId, session: sessionId },
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY as string,
      {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN
      }
    );
  }

  private signRefreshToken(
    userId: ObjectId,
    sessionId: Types.ObjectId
  ): string {
    return sign(
      { user: userId, session: sessionId },
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY as string,
      {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN
      }
    );
  }
}
