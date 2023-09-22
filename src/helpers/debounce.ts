// export default function debounce(func: Function, wait: number) {
//   return () =>
//     new Promise((resolve) => {
//       setTimeout(() => resolve(func()), wait);
//     });
// }

export default function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
