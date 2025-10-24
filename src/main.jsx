import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW, setupInstallPrompt } from './registerSW.js'

// Register Service Worker
registerSW();
setupInstallPrompt();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
