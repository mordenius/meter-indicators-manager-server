import dotenv from "dotenv";
import {
  initializeLogger,
  initializeDataSource,
} from "./_frameworks";

import { Meter } from "./meters/meter.entity";
import { MeterChange } from "./meters/changes/meterChange.entity";

dotenv.config();

const logger = initializeLogger();

async function main(): Promise<void> {
  await initializeDataSource({
    logger,
    entities: [Meter, MeterChange]
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
