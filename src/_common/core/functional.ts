export function flow<T>(...args: Function[]): T {
  return args.reduce((result, fn) => fn(result), undefined as any) as T;
}
