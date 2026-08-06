import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cheq — Shift & Income Tracker',
    short_name: 'Cheq',
    description: 'Track shifts, calculate earnings, and manage your part-time income.',
    start_url: '/home',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#171717',
    theme_color: '#171717',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
