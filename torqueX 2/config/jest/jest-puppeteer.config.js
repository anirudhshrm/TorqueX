module.exports = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.HEADLESS === 'false' ? 1500 : 0,
    devtools: process.env.HEADLESS === 'false',
    args: [
      '--window-size=1280,800',
      '--window-position=100,100',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-dev-shm-usage'
    ],
    defaultViewport: {
      width: 1280,
      height: 800
    },
    // Keep browser open for manual inspection
    dumpio: process.env.HEADLESS === 'false'
  },
  browserContext: 'default',
  // Only start server if testing locally (no BASE_URL provided)
  ...(process.env.BASE_URL ? {} : {
    server: {
      command: 'npm start',
      port: 3000,
      launchTimeout: 60000,
      protocol: 'http',
      usedPortAction: 'kill'
    }
  })
};
