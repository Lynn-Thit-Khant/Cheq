'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function DynamicFavicon() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) return
    const isDark = resolvedTheme === 'dark'
    // Light mode app: Black C badge (favicon-dark.svg) for sharp contrast on light tab
    // Dark mode app: White C badge (favicon-light.svg) for sharp contrast on dark tab
    const iconUrl = isDark ? '/favicon-light.svg' : '/favicon-dark.svg'

    const existingLinks = document.querySelectorAll("link[rel*='icon']")
    existingLinks.forEach((el) => el.remove())

    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/svg+xml'
    link.href = `${iconUrl}?v=${Date.now()}`
    document.head.appendChild(link)
  }, [resolvedTheme])

  return null
}
