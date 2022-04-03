import { DataSource, DataSourceOptions, EntitySchema } from "typeorm";
import { Logger } from "../logger";

export async function initialize(
  logger: Logger,
  entities: EntitySchema[]
): Promise<DataSource> {
  const dataSourceOptions: DataSourceOptions = {
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PSWD,
    database: process.env.DB_NAME,
    entities
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
