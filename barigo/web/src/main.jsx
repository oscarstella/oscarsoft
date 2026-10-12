import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { voiceService } from './services/voiceService';
import { syncService } from './services/syncService';

if (typeof window !== 'undefined') {
  window.voiceService = voiceService;
  window.syncService = syncService;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
