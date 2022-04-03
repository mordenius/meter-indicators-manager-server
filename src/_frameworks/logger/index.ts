import winston, { createLogger, Logger } from "winston";

export { Logger };

process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  winston.error("unhandledRejection", error);
});

export function init(): Logger {
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
