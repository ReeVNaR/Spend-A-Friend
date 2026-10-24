import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(20px)',
              color: '#0f172a',
              border: '1px solid rgba(191, 219, 254, 0.9)',
              borderRadius: '16px',
              boxShadow: '0 12px 32px -4px rgba(37, 99, 235, 0.12), 0 2px 8px 0 rgba(0, 0, 0, 0.04)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#2563eb',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#1d4ed8',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register PWA service worker for native installability and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Spend-A-Friend PWA active with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA service worker registration notice:', err);
      });
  });
}
