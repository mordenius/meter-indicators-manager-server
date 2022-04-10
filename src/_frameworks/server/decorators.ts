import { IncomingHttpHeaders, ServerHttp2Stream } from "http2";
import {
  METHOD_META,
  PATH_META,
  STATUS_CODE_META,
  HEADERS_META,
  PARAMETERS_ORDER_NETA,
  SERVER_INCOMING_STREAM_META,
  Method
} from "./constants";

export enum ServerIncomingStreamDataField {
  METHOD = "method",
  URL = "url",
  STREAM = "stream",
  BODY = "body",
  HEADERS = "headers",
  QUERY = "query",
  PARAMS = "params"
}

export interface ServerIncomingStreamData {
  [ServerIncomingStreamDataField.METHOD]: string;
  [ServerIncomingStreamDataField.URL]: URL;
  [ServerIncomingStreamDataField.STREAM]: ServerHttp2Stream;
  [ServerIncomingStreamDataField.BODY]: Object | string | null;
  [ServerIncomingStreamDataField.HEADERS]: IncomingHttpHeaders;
  [ServerIncomingStreamDataField.QUERY]: { [key: string]: string };
  [ServerIncomingStreamDataField.PARAMS]: { [key: string]: string };
}

type ParameterIndex = number;
interface ParametersOrder {
  [ServerIncomingStreamDataField.METHOD]?: ParameterIndex;
  [ServerIncomingStreamDataField.URL]?: ParameterIndex;
  [ServerIncomingStreamDataField.STREAM]?: ParameterIndex;
  [ServerIncomingStreamDataField.BODY]?: ParameterIndex;
  [ServerIncomingStreamDataField.HEADERS]:
    | ParameterIndex
    | { [key: string]: ParameterIndex };
  [ServerIncomingStreamDataField.QUERY]: { [key: string]: ParameterIndex };
  [ServerIncomingStreamDataField.PARAMS]: { [key: string]: ParameterIndex };
}

export function Controller(path: string): ClassDecorator {
  return <TFunction extends Function>(target: TFunction) => {
    Reflect.defineMetadata(PATH_META, path, target);
    return target;
  };
}

function applyMethodDecorator(method: string) {
  return function(subPath: string = ""): MethodDecorator {
    return function(
      target: Object,
      key: string | symbol,
      descriptor: TypedPropertyDescriptor<any>
    ) {
      const original = descriptor.value;
      if (typeof original !== "function") {
        return descriptor;
      }

      descriptor.value = function(...args: unknown[]) {
        const { params, query, headers, ...rests } = Reflect.getMetadata(
          SERVER_INCOMING_STREAM_META,
          target.constructor
        ) as ServerIncomingStreamData;

        const paramsOrder: {
          [key: string | symbol]: ParametersOrder;
        } = Reflect.getMetadata(PARAMETERS_ORDER_NETA, target.constructor);

        for (const name in [
          ServerIncomingStreamDataField.BODY,
          ServerIncomingStreamDataField.METHOD,
          ServerIncomingStreamDataField.STREAM,
          ServerIncomingStreamDataField.URL
        ]) {
          if (typeof (paramsOrder?.[key] as any)?.[name] === "number") {
            args[paramsOrder?.[key]?.body as number] = (rests as any)[name];
          }
        }

        for (const name of Object.keys(paramsOrder?.[key]?.params || {})) {
          const index = paramsOrder?.[key]?.params?.[name];
          if (typeof index === "undefined") {
            continue;
          }
          args[index] = params[name];
        }

        for (const name of Object.keys(paramsOrder?.[key]?.query || {})) {
          const index = paramsOrder?.[key]?.query?.[name];
          if (typeof index === "undefined") {
            continue;
          }
          args[index] = query[name];
        }

        if (typeof paramsOrder?.[key]?.headers === "number") {
          args[paramsOrder?.[key]?.headers as number] = headers;
        } else {
          for (const name of Object.keys(paramsOrder?.[key]?.headers || {})) {
            const index = (paramsOrder?.[key]?.headers as {
              [key: string]: number;
            })?.[name];
            if (typeof index === "undefined") {
              continue;
            }
            args[index] = headers[name];
          }
        }

        return original.apply(this, args);
      };

      Reflect.defineMetadata(PATH_META, subPath, descriptor.value);
      Reflect.defineMetadata(METHOD_META, method, descriptor.value);
      return descriptor;
    };
  };
}

export const Get = applyMethodDecorator(Method.GET);
export const Post = applyMethodDecorator(Method.POST);
export const Put = applyMethodDecorator(Method.PUT);
export const Patch = applyMethodDecorator(Method.PATCH);
export const Delete = applyMethodDecorator(Method.DELETE);

export function StatusCode(code: number): MethodDecorator {
  return function(
    _target: Object,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    Reflect.defineMetadata(STATUS_CODE_META, code, descriptor.value);
    return descriptor;
  };
}

export function Header(key: string, value: string): MethodDecorator {
  return function(
    _target: Object,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const previousValue =
      Reflect.getMetadata(HEADERS_META, descriptor.value) || [];
    const values = [...previousValue, { [key]: value }];
    Reflect.defineMetadata(HEADERS_META, values, descriptor.value);
    return descriptor;
  };
}

function attachParameterMeta(
  key: ServerIncomingStreamDataField,
  subKey: string = ""
): ParameterDecorator {
  return function(
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    const paramsOrder =
      (Reflect.getMetadata(PARAMETERS_ORDER_NETA, target.constructor) as {
        [key: string | symbol]: ParametersOrder;
      }) || {};

    if (!paramsOrder[propertyKey]) {
      paramsOrder[propertyKey] = { query: {}, params: {}, headers: {} };
    }

    switch (key) {
      case ServerIncomingStreamDataField.QUERY:
        paramsOrder[propertyKey].query[subKey] = parameterIndex;
        break;
      case ServerIncomingStreamDataField.PARAMS:
        paramsOrder[propertyKey].params[subKey] = parameterIndex;
        break;

      case ServerIncomingStreamDataField.HEADERS:
        if (subKey) {
          (paramsOrder[propertyKey].headers as any)[subKey] = parameterIndex;
          break;
        }
        paramsOrder[propertyKey].headers = parameterIndex;
        break;

      default:
        paramsOrder[propertyKey][key] = parameterIndex;
        break;
    }

    Reflect.defineMetadata(
      PARAMETERS_ORDER_NETA,
      paramsOrder,
      target.constructor
    );
  };
}
export const Param = (paramKey: string): ParameterDecorator =>
  attachParameterMeta(ServerIncomingStreamDataField.PARAMS, paramKey);

export const Query = (queryKey: string): ParameterDecorator =>
  attachParameterMeta(ServerIncomingStreamDataField.QUERY, queryKey);

export const Headers = (key?: string) =>
  attachParameterMeta(ServerIncomingStreamDataField.HEADERS, key);

export const Body = (): ParameterDecorator =>
  attachParameterMeta(ServerIncomingStreamDataField.BODY);

export const Stream = () =>
  attachParameterMeta(ServerIncomingStreamDataField.STREAM);
