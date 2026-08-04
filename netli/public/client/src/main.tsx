import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0f0f1e',
            color: '#f1f1f6',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0f0f1e' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0f0f1e' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
