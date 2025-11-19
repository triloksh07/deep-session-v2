// // workbox-config.js
// module.exports = {
//   globDirectory: ".next", // Next.js build output
//   globPatterns: [
//     "**/*.{js,css,html,png,svg,ico,json}"
//   ],
//   swDest: "public/sw.js", // output service worker
//   clientsClaim: true,
//   skipWaiting: true,
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/www.gstatic.com\/firebasejs\//,
//       handler: "CacheFirst",
//       options: {
//         cacheName: "firebase-sdks",
//         expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
//       }
//     },
//     {
//       urlPattern: /^https:\/\/firestore\.googleapis\.com\//,
//       handler: "NetworkFirst",
//       options: {
//         cacheName: "firestore-api",
//         networkTimeoutSeconds: 10,
//         expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
//       }
//     }
//   ]
// };
