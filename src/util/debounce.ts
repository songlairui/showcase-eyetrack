interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function debounce<T extends Function>(
  fn: T,
  delay: number,
  options?: DebounceOptions
) {
  let timer: any;

  let { leading = false, trailing = true } = options || {};

  return function (this: any, ...args: any[]) {
    let result: any;
    if (leading && !timer) {
      result = fn.apply(this, args);
    }

    clearTimeout(timer);

    timer = setTimeout(() => {
      if (trailing) {
        result = fn.apply(this, args);
      }
      timer = null;
    }, delay);
    return result;
  } as unknown as T;
}
