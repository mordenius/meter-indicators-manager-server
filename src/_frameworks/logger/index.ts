import winston, { createLogger, Logger } from "winston";
import { ReqisterTool } from "./../core";

export { Logger };

process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  winston.error("unhandledRejection", error);
});


function _initialize(): Logger {
  const logConfiguration = {
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
    silent: process.env.APP_ENV === "test"
  };
  
  return createLogger(logConfiguration);
}

export const initialize = ReqisterTool<Logger>("logger", _initialize);
