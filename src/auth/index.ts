import "reflect-metadata";
import {
  initializeLogger,
  initializeConfiguration,
  initializeDataSource,
  initializeServer
} from "./_frameworks";

const SERVICE_NAME = "auth";

import { AuthController } from "./users/auth.controller";
import { User } from "./users/user.entity";
import { Session } from "./users/session.entity";

initializeConfiguration(SERVICE_NAME);
const logger = initializeLogger();

async function main(): Promise<void> {
  await initializeDataSource({ logger, entities: [User, Session] });

  const closeServer = await initializeServer({
    logger,
    controllers: [AuthController]
  });
}

main()
  .then(() => {
    logger.info("Application successful started");
  })
  .catch(err => {
    console.log(err);
    logger.error("Application launch was failed", err);
  });
