import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'var(--clr-surface-2)',
                    color: 'var(--clr-text)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                  },
                  success: { iconTheme: { primary: 'var(--clr-success)', secondary: 'var(--clr-surface-2)' } },
                  error: { iconTheme: { primary: 'var(--clr-error)', secondary: 'var(--clr-surface-2)' } },
                }}
              />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
