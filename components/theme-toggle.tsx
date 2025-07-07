"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-8 w-16 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 animate-pulse" />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      className={`relative inline-flex h-9 w-20 items-center rounded-full border-2 transition-all duration-300 ${
        isDark ? "bg-slate-900 border-slate-500" : "bg-yellow-200 border-yellow-500"
      }`}
    >
      <span
        className={`absolute top-1 left-1 h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 flex items-center justify-center ${
          isDark ? "translate-x-10" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 font-extrabold text-slate-800" />
        ) : (
          <Sun className="h-4 w-4 font-extrabold text-yellow-600" />
        )}
      </span>
    </button>
  )
}
