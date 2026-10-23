import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeFirebase } from './services/firebase.service'
import { MESSAGES } from './utils/messages'

// Initialize Firebase before rendering app
initializeFirebase()
  .then(() => {
    console.log('🔥 Firebase ready, rendering app...')
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Failed to initialize Firebase:', error)
    // Show error UI
    document.getElementById('root')!.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; background: #fee2e2; color: #991b1b; padding: 2rem;">
        <div style="max-width: 500px; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Can't start</h1>
          <p style="margin-bottom: 1rem;">${MESSAGES.bootFailed}</p>
          <button onclick="location.reload()" style="margin-top: 1rem; background: #991b1b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer;">Reload</button>
        </div>
      </div>
    `
  })
