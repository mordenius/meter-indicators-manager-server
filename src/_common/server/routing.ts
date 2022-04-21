import { IncomingHttpHeaders, ServerHttp2Stream } from "http2";
import winston from "winston";
import { pathToRegexp, Key } from "path-to-regexp";

import { Logger } from "../logger";
import {
  METHOD_META,
  PATH_META,
  STATUS_CODE_META,
  SERVER_INCOMING_STREAM_META,
  Method
} from "./constants";
import { ServerIncomingStreamData } from "./decorators";

export interface Controller {
  new (...args: any[]): Controller;
  [key: string]: Function;
}

const map = new Map<Method, Set<[RegExp, Key[], Controller, Function]>>();

map.set(Method.GET, new Set<[RegExp, Key[], Controller, Function]>());
map.set(Method.POST, new Set<[RegExp, Key[], Controller, Function]>());
map.set(Method.PUT, new Set<[RegExp, Key[], Controller, Function]>());
map.set(Method.PATCH, new Set<[RegExp, Key[], Controller, Function]>());
map.set(Method.DELETE, new Set<[RegExp, Key[], Controller, Function]>());

export function applyRouting(logger: Logger, controllers: Controller[]): void {
  for (const controller of controllers) {
    const path = Reflect.getMetadata(PATH_META, controller);
    const args = Reflect.getMetadata("__args", controller);
    const instance = new controller(...(args || []));

    logger.debug("Register Routing\n====================");
    for (const key of Object.getOwnPropertyNames(controller.prototype)) {
      let descriptor = Object.getOwnPropertyDescriptor(
        controller.prototype,
        key
      );

      if (!descriptor || key === "constructor") {
        continue;
      }

      const method = Reflect.getMetadata(METHOD_META, descriptor?.value);
      const subPath = Reflect.getMetadata(PATH_META, descriptor?.value);
      logger.debug(`[${method}] \t ${path}/${subPath} \t ${key} `);

      const keys: Key[] = [];
      const regexp = pathToRegexp(subPath ? `${path}/${subPath}` : path, keys);

      let set = map.get(method);
      if (typeof set === "undefined") {
        map.set(
          method,
          new Set([[regexp, keys, instance, instance[key].bind(instance)]])
        );
        continue;
      }

      set.add([regexp, keys, instance, instance[key].bind(instance)]);
    }

    logger.debug("\n====================");
  }
}

export async function route(
  stream: ServerHttp2Stream,
  headers: IncomingHttpHeaders
): Promise<void> {
  let handler: Function | undefined;
  let target: Controller | undefined;

  const urlString = `${headers[":scheme"]}://${headers[":authority"]}${headers[":path"]}`;
  const method = headers[":method"] as string;
  const url = new URL(urlString);

  const set = map.get(method as Method);

  if (typeof set === "undefined") {
    stream.respond({
      "content-type": "text/html; charset=utf-8",
      ":status": 404
    });
    stream.end();

    return;
  }

  const incomingData: ServerIncomingStreamData = {
    method,
    url,
    headers,
    stream,
    body: null,
    query: {},
    params: {}
  };

  for (const [paramKey, paramValue] of url.searchParams.entries()) {
    incomingData.query[paramKey] = paramValue;
  }

  for (const [regexp, keys, _target, fn] of set) {
    const regexpArray = regexp.exec(url.pathname);
    if (!regexpArray) {
      continue;
    }
    handler = fn;
    target = _target;
    for (let i = 1; i < regexpArray.length; i++) {
      const key = keys[i - 1];
      const prop = key.name;
      const val = regexpArray[i];

      if (typeof val !== "undefined") {
        incomingData.params[prop as string] = val;
      }
    }
    break;
  }

  if (!handler) {
    stream.respond({
      "content-type": "text/html; charset=utf-8",
      ":status": 404
    });
    stream.end();

    return;
  }

  const chunks: (string | Buffer)[] = [];

  stream.on("data", function(chunk: string | Buffer) {
    chunks.push(chunk);
  });

  stream.on("error", function(err: Error): void {
    console.log(err);
    stream.end();
  });

  stream.on("end", async function() {
    if (
      headers["content-type"] === "application/json" &&
      (headers[":method"] === Method.POST ||
        headers[":method"] === Method.PATCH ||
        headers[":method"] === Method.PUT)
    ) {
      incomingData.body = JSON.parse(Buffer.concat(chunks as any).toString());
    } else {
      incomingData.body = Buffer.concat(chunks as any).toString();
    }

    if (!handler) {
      return;
    }

    if (target) {
      Reflect.defineMetadata(
        SERVER_INCOMING_STREAM_META,
        incomingData,
        target.constructor
      );
    }
    const status = Reflect.getMetadata(STATUS_CODE_META, handler);

    let result;
    try {
      result = await handler();
    } catch (err) {
      stream.respond({
        "content-type": "application/json",
        ":status": 500
      });

      stream.end(`{ "message": "${(err as Error)?.message}" }`);
    }

    if (stream.writableEnded) {
      return;
    }

    if (stream.headersSent) {
      stream.end(result || "Done");
      return;
    }

    if (typeof result === "object") {
      stream.respond({
        "content-type": "application/json",
        ":status": status || 200
      });

      stream.end(JSON.stringify(result) || "Done");
    } else if (typeof result === "string") {
      stream.respond({
        "content-type": "html/text; charset=utf-8",
        ":status": status || 200
      });

      stream.end(result || "Done");
    } else {
      winston.error(`Unsupported server answer type ${typeof result}`);

      stream.respond({
        "content-type": "application/json",
        ":status": 500
      });

      stream.end(`{ "message": "Something went wrong" }`);
    }
  });
}
