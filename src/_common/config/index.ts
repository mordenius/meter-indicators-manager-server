import dotenv from "dotenv";

export enum Environment {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
  TEST = "test",
  TEST_DOCKER = "test.docker"
}

export function initialize(serviceName: string): dotenv.DotenvConfigOutput {
  let environment = defineEnvironment();
  return dotenv.config({
    path: `./config/.env.${serviceName}${
      environment === Environment.PRODUCTION ? "" : "." + environment
    }`
  });
}

function defineEnvironment(): Environment {
  if (typeof process.env.APP_ENV === "undefined") {
    return Environment.PRODUCTION;
  }
  return process.env.APP_ENV as Environment;
}
