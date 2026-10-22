/**
 * Search rules shared by the extension list and the command menu.
 *
 * The query is split into words; an item matches if every word of the query
 * is the beginning of some word in the searched texts. Words are separated by
 * anything that is not a letter or a digit, so `rtk_gps` consists of `rtk` and
 * `gps`. Matching is case-insensitive.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

/** Returns whether every word of the query starts a word in the texts. */
export function matchesSearch(texts: string[], query: string): boolean {
  const terms = tokenize(query)
  if (terms.length === 0) {
    return true
  }

  const words = texts.flatMap(tokenize)
  return terms.every((term) => words.some((word) => word.startsWith(term)))
}

/**
 * Filter function for `cmdk`: items whose primary text matches score higher
 * than items that match only through their keywords.
 */
export function scoreCommand(
  value: string,
  search: string,
  keywords: string[] = [],
): number {
  if (matchesSearch([value], search)) {
    return 1
  }
  return matchesSearch([value, ...keywords], search) ? 0.5 : 0
}
