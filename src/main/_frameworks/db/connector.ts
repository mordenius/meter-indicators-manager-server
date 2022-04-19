import { DataSource, DataSourceOptions } from "typeorm";
import { ReqisterTool, Logger, isDevOrTestEnv } from "../index";

import { SnakeNamingStrategy } from "./snakeNaming.strategy";

export interface DatabaseOptions {
  logger: Logger;
  entities: Function[];
}

export async function _initialize({
  logger,
  entities
}: DatabaseOptions): Promise<DataSource> {
  const dataSourceOptions: DataSourceOptions = {
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PSWD,
    database: process.env.DB_NAME,
    entities,
    synchronize: isDevOrTestEnv(),
    namingStrategy: new SnakeNamingStrategy()
  };

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    logger.info("Data Source has been initialized");
  } catch (err) {
    logger.error("Error during Data Source initialization", err);
    throw err;
  }

  return dataSource;
}

export const initialize = ReqisterTool<Promise<DataSource>>(
  "dataSource",
  _initialize
);
