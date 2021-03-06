import dotenv from "dotenv";
import { DataSource, EntityTarget } from "typeorm";

import {
  initializeLogger,
  initializeDataSource,
  initializeServer
} from "../../_frameworks";

import { Meter } from "../../meters/meter.entity";
import { MeterChange } from "../../meters/changes/meterChange.entity";

import { MetersController } from "../../meters/meters.controller";

dotenv.config({ path: ".env.test.docker" });

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

export function getDataSource(): DataSource {
  return dataSource;
}

export function emptyDataTable<T>(entity: EntityTarget<T>): Promise<void> {
  const repository = getDataSource().getRepository(entity);

  return repository.query(
    `DELETE FROM ${process.env.DB_NAME}.${repository.metadata.tableName}`
  );
}
