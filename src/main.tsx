import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeFirebase } from './services/firebase.service'
import { BootError } from './components/BootError'

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
    createRoot(document.getElementById('root')!).render(<BootError error={error} />)
  })
