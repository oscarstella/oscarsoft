import React from 'react';
import { 
  Navigation, 
  Car, 
  Shield, 
  Smartphone, 
  Monitor, 
  Radio
} from 'lucide-react';
import { soundService } from '../services/soundService';

export default function Navbar({ 
  currentApp, 
  onSelectApp, 
  viewMode, 
  onSelectViewMode 
}) {
  return (
    <header className="barigo-top-nav">
      <div className="nav-inner-container">
        {/* LOGO Y MARCA */}
        <div className="nav-brand-group">
          <div className="brand-logo-text">
            <span className="logo-part-bari">Bari</span>
            <span className="logo-part-go">Go</span>
          </div>
          <span className="brand-city-tag">San Carlos de Bariloche</span>
        </div>

        {/* SELECTOR DE APPS DEDICADAS (PASAJERO / CHOFER / ADMIN) */}
        <div className="nav-app-switcher">
          <button 
            className={`app-switch-btn ${currentApp === 'passenger' ? 'active' : ''}`}
            onClick={() => {
              soundService.playTapSound();
              onSelectApp('passenger');
            }}
          >
            <Navigation size={15} />
            <span>Pasajero</span>
          </button>

          <button 
            className={`app-switch-btn ${currentApp === 'driver' ? 'active' : ''}`}
            onClick={() => {
              soundService.playTapSound();
              onSelectApp('driver');
            }}
          >
            <Car size={15} />
            <span>Chofer</span>
          </button>

          <button 
            className={`app-switch-btn ${currentApp === 'admin' ? 'active' : ''}`}
            onClick={() => {
              soundService.playTapSound();
              onSelectApp('admin');
            }}
          >
            <Shield size={15} />
            <span>Admin</span>
          </button>
        </div>

        {/* SELECTOR DE MODO DE VISUALIZACIÓN */}
        <div className="nav-view-switcher">
          <button 
            className={`view-mode-btn ${viewMode === 'fullscreen' ? 'active' : ''}`}
            onClick={() => {
              soundService.playTapSound();
              onSelectViewMode('fullscreen');
            }}
            title="Vista Completa"
          >
            <Monitor size={15} />
            <span className="mode-label">Pantalla Completa</span>
          </button>

          {currentApp !== 'admin' && (
            <button 
              className={`view-mode-btn ${viewMode === 'phone' ? 'active' : ''}`}
              onClick={() => {
                soundService.playTapSound();
                onSelectViewMode('phone');
              }}
              title="Vista Móvil"
            >
              <Smartphone size={15} />
              <span className="mode-label">Formato Móvil</span>
            </button>
          )}
        </div>

        {/* ESTADO DE CONEXIÓN */}
        <div className="nav-status-indicator">
          <span className="status-live-dot"></span>
          <span className="status-live-text">GPS WebSockets</span>
        </div>
      </div>
    </header>
  );
}
