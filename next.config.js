module.exports = {
  reactStrictMode: true,
  // HTML hujjatlar kešlanmasin — preview doim yangi sahifani ko'rsatsin
  async headers() {
    return [
      {
        source: '/((?!_next|images|favicon).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' }
        ]
      }
    ]
  },
}
