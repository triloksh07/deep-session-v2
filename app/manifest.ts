import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DeepSession-v3',
    short_name: 'DeepSession',
    description: 'AI powered focus coach',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#0f172a',
    icons: [
        {
            "src": "/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
    ],
  }
}