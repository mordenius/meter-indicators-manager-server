import { connect, ConnectOptions, Mongoose } from "mongoose";
import { ReqisterTool, Logger } from "../index";

export const DATA_SOURCE_TOOL_NAME = "dataSource";

export interface DatabaseOptions {
  logger: Logger;
}

export async function _initialize({
  logger
}: DatabaseOptions): Promise<Mongoose> {
  const url = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  const dataSourceOptions: ConnectOptions = {
    user: process.env.DB_USER,
    pass: process.env.DB_PSWD
  };

  try {
    const dataSource = await connect(url, dataSourceOptions);
    logger.info("Data Source has been initialized");
    return dataSource;
  } catch (err) {
    logger.error("Error during Data Source initialization", err);
    throw err;
  }
}

export const initialize = ReqisterTool<Promise<Mongoose>>(
  DATA_SOURCE_TOOL_NAME,
  _initialize
);
