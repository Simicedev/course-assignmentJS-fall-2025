// READ THIS CHANGE
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}
