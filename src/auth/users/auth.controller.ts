import { ServerHttp2Stream, IncomingHttpHeaders } from "http2";
import { sign, verify } from "jsonwebtoken";
import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  LOGGER_TOOL_NAME,
  Logger,
  Post,
  Stream,
  Tool
} from "../_frameworks";
import { AuthService } from "./auth.service";
import { UserInDto } from "./user.entity";

const {
  JWT_ACCESS_TOKEN_SECRET_KEY,
  JWT_ACCESS_TOKEN_EXPIRES_IN
} = process.env;

@Controller("")
export class AuthController {
  constructor(
    @Tool(LOGGER_TOOL_NAME) private readonly logger: Logger,
    @Inject(AuthService) private readonly authService: AuthService
  ) {}

  @Post("registration")
  async registration(
    @Body() { email, pswd }: UserInDto,
    @Stream() stream: ServerHttp2Stream
  ): Promise<{ message: string }> {
    this.logger.info("User register", email);

    try {
      await this.authService.registration({ email, pswd });
    } catch (err) {
      this.logger.warn((err as any).message);

      stream.respond({
        "content-type": "application/json",
        ":status": 400
      });

      stream.write(JSON.stringify({ message: (err as any).message }));
      stream.end();
    }

    return { message: "Registration successfull" };
  }

  @Post("login")
  async login(
    @Body() { email, pswd }: UserInDto,
    @Stream() stream: ServerHttp2Stream,
    @Headers() headers: IncomingHttpHeaders
  ): Promise<void | { message: string }> {
    const userAgent = headers["user-agent"] as string;

    const { accessToken, refreshToken } = await this.authService.login({
      email,
      pswd,
      userAgent
    });

    stream.respond({
      "content-type": "application/json",
      ":status": 200,
      "Set-Cookie": [`path=/; httpOnly=true; accessToken=${accessToken}`]
    });

    stream.write(
      JSON.stringify({ message: "User login", accessToken, refreshToken })
    );
    stream.end();
  }

  @Get("login")
  async testBrowser(
    @Stream() stream: ServerHttp2Stream,
    @Headers() headers: IncomingHttpHeaders
  ): Promise<void> {
    console.log(this.authService);
    this.logger.debug("bla bla");
    const token = sign(
      headers,
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY as string,
      {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN
      }
    );

    stream.respond({
      "content-type": "application/json",
      ":status": 200,
      "Set-Cookie": [`accessToken=${token}; HttpOnly; Secure`]
    });

    stream.write(JSON.stringify({ message: "User login", accessToken: token }));
    stream.end();
  }

  @Post("logout")
  async logout(
    @Body() body: any,
    @Headers() headers: IncomingHttpHeaders
  ): Promise<{ message: string }> {
    const { closeAllSessions } = body;

    const { accessToken } = this.parseCookies(headers.cookie as string);
    await this.authService.logout(accessToken, closeAllSessions);

    return { message: "Logout" };
  }

  private parseCookies(cookieHeader: string): { [key: string]: string } {
    const list: { [key: string]: string } = {};
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
      let [name, ...rest] = cookie.split(`=`);
      name = name?.trim();
      if (!name) return;
      const value = rest.join(`=`).trim();
      if (!value) return;
      list[name] = decodeURIComponent(value);
    });

    return list;
  }
}
