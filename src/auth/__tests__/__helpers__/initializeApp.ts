import "reflect-metadata";
import { Mongoose, Model } from "mongoose";

import {
  initializeConfiguration,
  initializeDataSource,
  initializeLogger,
  initializeServer
} from "../../_frameworks";

import { AuthController } from "../../users/auth.controller";
import { User } from "../../users/user.entity";
import { Session } from "../../users/session.entity";

initializeConfiguration("auth");
const logger = initializeLogger();

let dataSource: Mongoose;
let stopServer: () => Promise<void>;

async function main(): Promise<void> {
  dataSource = await initializeDataSource({
    logger,
    entities: [User, Session]
  });

  stopServer = await initializeServer({
    logger,
    controllers: [AuthController]
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
  await dataSource.connection.close();
}

export function getDataSource(): Mongoose {
  return dataSource;
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
