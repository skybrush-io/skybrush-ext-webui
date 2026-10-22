import { describe, expect, it } from 'vitest'

import { matchesSearch, scoreCommand } from './search'

describe('matchesSearch', () => {
  const gps = ['gps', 'External GPS receivers as beacons', 'hardware']

  it('matches everything for an empty query', () => {
    expect(matchesSearch(gps, '  ')).toBe(true)
  })

  it('matches word prefixes case-insensitively', () => {
    expect(matchesSearch(gps, 'GPS')).toBe(true)
    expect(matchesSearch(gps, 'rec')).toBe(true)
    expect(matchesSearch(gps, 'hard')).toBe(true)
  })

  it('does not match letters scattered across words', () => {
    expect(
      matchesSearch(['Version info', 'Python packages of the server'], 'gps'),
    ).toBe(false)
  })

  it('does not match inside words', () => {
    expect(matchesSearch(['debug', 'Debugging tools'], 'bug')).toBe(false)
  })

  it('requires every word of the query to match', () => {
    expect(matchesSearch(gps, 'gps beacon')).toBe(true)
    expect(matchesSearch(gps, 'gps server')).toBe(false)
  })

  it('splits identifiers at punctuation', () => {
    expect(matchesSearch(['rtk_gps'], 'gps')).toBe(true)
    expect(matchesSearch(['rtk_gps'], 'rtk_g')).toBe(true)
  })
})

describe('scoreCommand', () => {
  it('ranks primary text matches above keyword matches', () => {
    expect(scoreCommand('extension gps', 'gps')).toBe(1)
    expect(scoreCommand('extension rtk', 'gps', ['GPS corrections'])).toBe(0.5)
    expect(scoreCommand('page Version info', 'gps', ['Python packages'])).toBe(
      0,
    )
  })
})
