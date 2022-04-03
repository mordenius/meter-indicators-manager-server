import dotenv from "dotenv";
import { initializeLogger, initializeDataSource } from "./_frameworks";

dotenv.config();

const logger = initializeLogger();

async function main(): Promise<void> {
  const dataSource = await initializeDataSource(logger, []);
}

main()
  .then(() => {
    logger.info("Application successful started");
  })
  .catch(err => {
    logger.error("Application launch was failed", err);
  });
