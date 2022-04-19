import dotenv from "dotenv";

import {
  initializeLogger,
  initializeDataSource,
  initializeServer
} from "./_frameworks";

import { Meter } from "./meters/meter.entity";
import { MeterChange } from "./meters/changes/meterChange.entity";

import { MetersController } from "./meters/meters.controller";

dotenv.config();

const logger = initializeLogger();

async function main(): Promise<void> {
  await initializeDataSource({
    logger,
    entities: [Meter, MeterChange]
  });

  await initializeServer({
    logger,
    controllers: [MetersController]
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
