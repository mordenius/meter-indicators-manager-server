import {
  createSecureServer,
  Http2SecureServer,
  IncomingHttpHeaders,
  SecureServerOptions,
  ServerHttp2Session,
  ServerHttp2Stream
} from "http2";
import { readFileSync } from "fs";
import { AddressInfo } from "net";

import { flow } from "../core";
import { Logger } from "../logger";

import { applyRouting, Controller, route } from "./routing";

const DEFAULT_PORT = 8443;

export interface ServerOptions {
  logger: Logger;
  controllers: unknown[];
  port?: number;
  host?: string;
}

function compileServerOptions(): SecureServerOptions {
  return {
    key: readFileSync("cert/localhost-privkey.pem"),
    cert: readFileSync("cert/localhost-cert.pem")
  };
}

function attachObserver(
  logger: Logger,
  server: Http2SecureServer
): Http2SecureServer {
  server.on("error", err => logger.error(err));

  server.on("session", (session: ServerHttp2Session): void => {
    session.on("connect", (): void => {
      logger.http("session established");
    });
  });

  server.on(
    "stream",
    (stream: ServerHttp2Stream, headers: IncomingHttpHeaders) => {
      // stream is a Duplex

      logger.http(`Request: [${headers[":method"]}] ${headers[":path"]}`);

      try {
        route(stream, headers);
      } catch (err) {
        logger.error("Server Request Failed", err);

        stream.respond({
          "content-type": "text/html; charset=utf-8",
          ":status": 200
        });

        stream.end("<h1>Hello World</h1>");
      }
    }
  );

  return server;
}

function launchServer(
  logger: Logger,
  server: Http2SecureServer
): Promise<() => void> {
  return new Promise((resolve): void => {
    server.listen(process.env.PORT || DEFAULT_PORT, (): void => {
      const { port, address } = server.address() as AddressInfo;
      logger.info(`Server listening on ${address}:${port}`);

      resolve(closeServer.bind(null, logger, server));
    });
  });
}

function closeServer(logger: Logger, server: Http2SecureServer): Promise<void> {
  return new Promise((resolve, reject): void => {
    server.close((err: Error | undefined) => {
      if (err) {
        logger.error(err);
        return reject(err);
      }
      resolve();
    });
  });
}

export function initialize({
  logger,
  controllers
}: ServerOptions): Promise<() => Promise<void>> {
  applyRouting(logger, controllers as Controller[]);

  return flow<Promise<() => Promise<void>>>(
    compileServerOptions,
    createSecureServer,
    attachObserver.bind(null, logger),
    launchServer.bind(null, logger)
  );
}
