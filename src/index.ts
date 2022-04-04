import dotenv from "dotenv";
import { initializeLogger, initializeDataSource } from "./_frameworks";

import { Meter } from "./meters/meter.entity";
import { MeterChange } from "./meters/meterChange.entity";

dotenv.config();

const logger = initializeLogger();

async function main(): Promise<void> {
  const dataSource = await initializeDataSource(logger, [Meter, MeterChange]);
}

main()
  .then(() => {
    logger.info("Application successful started");
  })
  .catch(err => {
    logger.error("Application launch was failed", err);
  });
