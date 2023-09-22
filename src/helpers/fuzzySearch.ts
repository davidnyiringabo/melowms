export default function fuzzySearch(
  words: string[],
  searchTerm: string
): string[] {
  try {
    const regexString = searchTerm.split('').join('.*?').replace('\\', '');
    const regex = new RegExp(regexString, 'gi');
    const matches = words.filter((word) => {
      const match = regex.test(word);
      regex.lastIndex = 0;
      return match;
    });
    return matches.sort((a, b) => {
      const aScore = similarityScore(
        a.toString().toLowerCase(),
        searchTerm.toLowerCase()
      );
      const bScore = similarityScore(
        b.toString().toLowerCase(),
        searchTerm.toLowerCase()
      );
      return bScore - aScore;
    });
  } catch (e) {
    return words;
  }
}

export function similarityScore(a: string, b: string): number {
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const union = new Set([...setA, ...setB]);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  return intersection.size / union.size;
}
