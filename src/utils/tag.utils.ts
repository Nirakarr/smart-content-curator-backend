const ignoredTagWords = new Set([
  "about",
  "after",
  "from",
  "have",
  "that",
  "the",
  "this",
  "with",
]);

export const createTags = (title: string, source: string | null): string[] => {
  const words = `${title} ${source ?? ""}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !ignoredTagWords.has(word));

  return [...new Set(words)].slice(0, 5);
};
