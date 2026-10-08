import { useState } from 'react'

export interface SortState<K extends string> {
  key: K
  direction: 'asc' | 'desc'
}

/** Sort state of a table, with a toggle that flips the direction. */
export function useSort<K extends string>(initial: K) {
  const [sort, setSort] = useState<SortState<K>>({
    key: initial,
    direction: 'asc',
  })
  const toggle = (key: K) =>
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  return { sort, toggle }
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

/** Sorts items by the given key, comparing numbers within strings naturally. */
export function sortBy<T, K extends string>(
  items: T[],
  sort: SortState<K>,
  getValue: (item: T, key: K) => string | number | boolean | null,
): T[] {
  const factor = sort.direction === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const x = getValue(a, sort.key)
    const y = getValue(b, sort.key)
    if (typeof x === 'number' && typeof y === 'number') {
      return (x - y) * factor
    }
    return collator.compare(String(x ?? ''), String(y ?? '')) * factor
  })
}
