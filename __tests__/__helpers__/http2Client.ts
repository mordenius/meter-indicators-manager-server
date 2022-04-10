import { readFileSync } from "fs";
import {
  connect,
  ClientHttp2Session,
  IncomingHttpStatusHeader,
  IncomingHttpHeaders
} from "http2";

import { Method } from "../../src/_frameworks/server/constants";
export { Method };

const SERVER_BASE_URL = "https://localhost:8444";

let client: ClientHttp2Session;
export function connectToServer() {
  client = connect(SERVER_BASE_URL, {
    ca: readFileSync("cert/localhost-cert.pem")
  });

  client.on("error", err => console.error(err));
}


interface RequestParameters {
  path: string;
  method: Method;
}

interface Response<T> {
  data: T;
  headers: IncomingHttpHeaders & IncomingHttpStatusHeader;
  statusCode: number;
}

export function request<T>({
  path,
  method = Method.GET
}: RequestParameters): Promise<Response<T>> {
  const req = client.request({ ":path": path, ":method": method });
  let headers: IncomingHttpHeaders & IncomingHttpStatusHeader;

  req.on("response", (_headers, flags) => {
    headers = _headers;
  });

  req.setEncoding("utf8");
  let data = "";
  req.on("data", chunk => {
    data += chunk;
  });

  return new Promise((resolve): void => {
    req.on("end", () => {
      console.log(`\n${data}`);
      client.close();
      resolve({
        data:
          headers["content-type"] === "application/json"
            ? JSON.parse(data)
            : data,
        headers,
        statusCode: Number(headers[":status"])
      });
    });
    req.end();
  });
}
