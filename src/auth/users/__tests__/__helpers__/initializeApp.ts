import "reflect-metadata";
import { Mongoose, Model } from "mongoose";
import {
  initializeConfiguration,
  initializeLogger,
  initializeDataSource,
  Logger
} from "../../../_frameworks";

let logger: Logger;
let dataSource: Mongoose;

export async function startApp(): Promise<void> {
  initializeConfiguration("auth");
  logger = initializeLogger();
  dataSource = await initializeDataSource({ logger });
}

export async function stopApp(): Promise<void> {
  await dataSource.connection.close();
}

export function getLogger(): Logger {
  return logger;
}

export async function dropCollection<T>(model: Model<T>): Promise<void> {
  try {
    const collections = await dataSource.connection.db
      .listCollections()
      .toArray();

    for (const { name } of collections) {
      if (name === model.collection.collectionName) {
        await model.collection.drop();
        break;
      }
    }
  } catch (err) {
    console.log("erorr while drop collection", (err as any)?.message);
  }
}
