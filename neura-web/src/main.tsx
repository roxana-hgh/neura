import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/app/App'
import '@/stores/themeStore'
import '@/features/pwa/stores/installStore'
import { registerServiceWorker } from '@/features/notifications/lib/push'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
