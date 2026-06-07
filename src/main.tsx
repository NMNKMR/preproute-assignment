import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/features/auth/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              // Brand-themed success toast (brand-50 bg / brand-700 text / brand-200 border).
              success: {
                iconTheme: { primary: '#5b6cf5', secondary: '#ffffff' },
                style: {
                  background: '#eef0fe',
                  color: '#3a45ad',
                  border: '1px solid #bcc3fb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
