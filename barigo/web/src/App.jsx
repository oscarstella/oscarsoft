import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PassengerApp from './components/passenger/PassengerApp';
import DriverApp from './components/driver/DriverApp';
import AdminApp from './components/admin/AdminApp';
import PhoneFrame from './components/common/PhoneFrame';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

export default function App() {
  const [currentApp, setCurrentApp] = useState('passenger'); // 'passenger' | 'driver' | 'admin'
  const [viewMode, setViewMode] = useState('phone');          // 'phone' | 'fullscreen'
  const [sharedRide, setSharedRide] = useState(null);

  // Detección automática de dispositivo móvil real
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setViewMode('phone');
    }
  }, []);

  return (
    <div className="barigo-root-layout">
      {/* Barra de Navegación y Selector de Apps BariGo */}
      <Navbar 
        currentApp={currentApp}
        onSelectApp={(app) => {
          setCurrentApp(app);
          if (app === 'admin' && viewMode === 'phone') {
            setViewMode('fullscreen');
          }
        }}
        viewMode={viewMode}
        onSelectViewMode={(mode) => setViewMode(mode)}
      />

      {/* ÁREA DE CONTENIDO */}
      <main className="barigo-main-viewport">
        {/* APP PASAJERO */}
        {currentApp === 'passenger' && (
          <ErrorBoundary fallbackTitle="Inconveniente en la App de Pasajero" onReset={() => setSharedRide(null)}>
            {viewMode === 'phone' ? (
              <div className="single-phone-wrapper">
                <PhoneFrame appName="BariGo Pasajero">
                  <PassengerApp 
                    viewMode="phone"
                    externalRide={sharedRide}
                    onRideChange={(ride) => setSharedRide(ride)}
                  />
                </PhoneFrame>
              </div>
            ) : (
              <div className="fullscreen-app-wrapper">
                <PassengerApp 
                  viewMode="fullscreen"
                  externalRide={sharedRide}
                  onRideChange={(ride) => setSharedRide(ride)}
                />
              </div>
            )}
          </ErrorBoundary>
        )}

        {/* APP CHOFER */}
        {currentApp === 'driver' && (
          <ErrorBoundary fallbackTitle="Inconveniente en la App de Chofer" onReset={() => setSharedRide(null)}>
            {viewMode === 'phone' ? (
              <div className="single-phone-wrapper">
                <PhoneFrame appName="BariGo Chofer">
                  <DriverApp 
                    viewMode="phone"
                    externalRide={sharedRide}
                    onRideChange={(ride) => setSharedRide(ride)}
                  />
                </PhoneFrame>
              </div>
            ) : (
              <div className="fullscreen-app-wrapper">
                <DriverApp 
                  viewMode="fullscreen"
                  externalRide={sharedRide}
                  onRideChange={(ride) => setSharedRide(ride)}
                />
              </div>
            )}
          </ErrorBoundary>
        )}

        {/* PORTAL ADMIN */}
        {currentApp === 'admin' && (
          <ErrorBoundary fallbackTitle="Inconveniente en el Portal Administrativo">
            <div className="fullscreen-app-wrapper">
              <AdminApp />
            </div>
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}
