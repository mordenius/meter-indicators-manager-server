const instances = new Map();
const tools = new Map();
const requests = new Map();
const instancesParameters = new Map();

export function Inject(inst: any) {
  return function(target: any, propertyKey: string, parameterIndex: number) {
    let instance = instances.get(inst);

    if (instance != null) {
      return;
    }

    const params: (any | null)[] = [];
    for (let i = 0; i < inst.length; i++) {
      params[i] = null;
    }

    if (instancesParameters.get(inst)) {
      let index = 0;
      for (const param of instancesParameters.get(inst)[0]) {
        if (param != null) {
          params[index] = param;
        }
        index++;
      }
    }

    const observer = () => {
      for (const param of instancesParameters.get(inst)[0]) {
        if (param == null) {
          return;
        }
      }

      instance = new inst(...instancesParameters.get(inst)[0]);
      _attachParameter(target, instance, parameterIndex);
    };

    instancesParameters.set(inst, [params, observer]);
  };
}

function _attachParameter(
  target: any,
  instance: any,
  parameterIndex: number
): void {
  let parameterOptions = instancesParameters.get(target);

  if (!parameterOptions) {
    parameterOptions = [[], () => {}];
  }

  const [parameters, notify] = parameterOptions;

  parameters[parameterIndex] = instance;
  instancesParameters.set(target, [parameters, notify]);

  Reflect.defineMetadata("__args", parameters, target);

  notify();
}

function _attachTool(target: any, name: string, parameterIndex: number): void {
  let instance = tools.get(name);
  _attachParameter(target, instance, parameterIndex);
}

function _setTool(name: string, result: unknown): unknown {
  tools.set(name, result);
  const listeners = requests.get(name);

  if (Array.isArray(listeners)) {
    listeners.forEach((listener: () => void): void => listener());
  }

  return result;
}

export function Tool(name: string) {
  return function(target: any, propertyKey: string, parameterIndex: number) {
    let instance = tools.get(name);

    if (instance) {
      _attachTool(target, name, parameterIndex);
      return;
    }

    let listeners = requests.get(name);

    if (!listeners) {
      listeners = [];
    }

    requests.set(name, [
      ...listeners,
      () => {
        _attachTool(target, name, parameterIndex);
      }
    ]);
  };
}

export function ReqisterTool<T>(
  name: string,
  fn: Function
): (...args: unknown[]) => T {
  return (...args) => {
    let result = fn.apply(fn, args);

    if (typeof result.then === "function") {
      return result.then((promiseResult: T) => {
        return _setTool(name, promiseResult);
      });
    }

    return _setTool(name, result);
  };
}
