import winston, { createLogger, Logger } from "winston";
import { ReqisterTool, flow } from "../core";

export { Logger };

function applyUnhandledRejection(logger: Logger): Logger {
  process.on("unhandledRejection", error => {
    logger.error("unhandledRejection", error);
  });

  return logger;
}

function compileLoggerOptions(): winston.LoggerOptions {
  return {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: "MMM-DD-YYYY HH:mm:ss"
      }),
      winston.format.printf(
        info => `[${info.level}] ${[info.timestamp]} -- ${info.message}`
      )
    ),
    handleExceptions: true,
    silent: process.env.APP_ENV === "test",
    level: process.env.APP_ENV === "development" ? "debug" : "info"
  };
}

function _initialize(options?: winston.LoggerOptions): Logger {
  return flow<Logger>(
    options ? () => options : compileLoggerOptions,
    createLogger,
    applyUnhandledRejection
  );
}

export const initialize = ReqisterTool<Logger>("logger", _initialize);
