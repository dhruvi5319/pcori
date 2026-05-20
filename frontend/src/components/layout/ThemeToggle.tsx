'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <button
      onClick={cycleTheme}
      aria-label="Toggle theme"
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-md',
        'text-gray-500 dark:text-gray-400',
        'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
        'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
      )}
    >
      {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
    </button>
  )
}
