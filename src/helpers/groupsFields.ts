export function groupObjectsAndSum<T>(
  arr: T[],
  field: keyof T,
  fieldsToSum: (keyof T)[]
): { grouped: Record<string, Partial<T>>; groupedArray: Partial<T>[] } {
  const grouped: Record<string, Partial<T>> = {};
  const groupedArray: Partial<T>[] = [];

  for (const obj of arr) {
    const key = obj[field] as string;

    if (grouped[key]) {
      const group = grouped[key];

      for (const fieldToSum of fieldsToSum) {
        group[fieldToSum] = ((Number(group[fieldToSum]) || 0) +
          Number(obj[fieldToSum])) as T[keyof T];
      }
    } else {
      grouped[key] = { ...obj };
      groupedArray.push(grouped[key]);
    }
  }

  return { grouped, groupedArray };
}
