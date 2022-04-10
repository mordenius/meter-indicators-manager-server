import dotenv from "dotenv";
import { DataSource } from "typeorm";

import {
  initializeLogger,
  initializeDataSource,
  initializeServer
} from "./../../src/_frameworks";

import { Meter } from "./../../src/meters/meter.entity";
import { MeterChange } from "./../../src/meters/changes/meterChange.entity";

import { MetersController } from "./../../src/meters/meters.controller";

dotenv.config();

const logger = initializeLogger();

let dataSource: DataSource;
let stopServer: () => Promise<void>;

async function main(): Promise<void> {
  dataSource = await initializeDataSource({
    logger,
    entities: [Meter, MeterChange]
  });

  stopServer = await initializeServer({
    logger,
    controllers: [MetersController]
  });
}

export async function startApp(): Promise<void> {
  try {
    await main();
    logger.info("Application successful started");
  } catch (err) {
    logger.error("Application launch was failed", err);
  }
}

export async function stopApp(): Promise<void> {
  await stopServer();
  await dataSource.destroy();
}
