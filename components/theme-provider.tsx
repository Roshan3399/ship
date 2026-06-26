"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "dark"

interface ThemeContextType {
  theme: Theme
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark" })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}
