// localStorage is a browser API, not available in Node.js
// To test localStorage, you need to:
// 1. Run your app: npm run dev
// 2. Open http://localhost:3000 in browser
// 3. Open DevTools Console (F12)
// 4. Paste this code:


console.log('Current theme:', localStorage.getItem('color-theme'));
console.log('All localStorage:', localStorage);


