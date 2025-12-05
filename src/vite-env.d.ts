/**
 * Vite Client Configuration
 * Suppress HMR WebSocket errors when using HTTPS
 */

// Suppress Vite WebSocket connection errors in console
// This is expected when using HTTPS with self-signed certificates
// The app will still work, just without hot module replacement
if (import.meta.hot) {
  import.meta.hot.on('vite:ws:connect', () => {
    console.log('✅ Vite HMR connected');
  });
  
  import.meta.hot.on('vite:ws:disconnect', () => {
    console.log('⚠️ Vite HMR disconnected - manual refresh required');
  });
}
