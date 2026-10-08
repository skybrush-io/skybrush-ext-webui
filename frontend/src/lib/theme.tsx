import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ThemeContext, type Theme } from './use-theme'

// Keep in sync with the inline script in the HTML page that applies the theme
// before the first paint
const STORAGE_KEY = 'skybrush-webui-theme'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') {
      return value
    }
  } catch {
    // Storage not available; fall back to the system theme
  }
  return 'system'
}

function storeTheme(theme: Theme) {
  try {
    if (theme === 'system') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, theme)
    }
  } catch {
    // Storage not available; the choice lasts until the page is reloaded
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [systemIsDark, setSystemIsDark] = useState(darkQuery.matches)

  useEffect(() => {
    const listener = (event: MediaQueryListEvent) =>
      setSystemIsDark(event.matches)
    darkQuery.addEventListener('change', listener)
    return () => darkQuery.removeEventListener('change', listener)
  }, [])

  const resolvedTheme =
    theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = useCallback((value: Theme) => {
    storeTheme(value)
    setThemeState(value)
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
