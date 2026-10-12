import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PassengerApp from './components/passenger/PassengerApp';
import DriverApp from './components/driver/DriverApp';
import AdminApp from './components/admin/AdminApp';
import PhoneFrame from './components/common/PhoneFrame';
import './App.css';

export default function App() {
  const [currentApp, setCurrentApp] = useState('passenger'); // 'passenger' | 'driver' | 'admin'
  const [viewMode, setViewMode] = useState('phone');          // 'phone' | 'fullscreen'
  const [sharedRide, setSharedRide] = useState(null);

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
          viewMode === 'phone' ? (
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
          )
        )}

        {/* APP CHOFER */}
        {currentApp === 'driver' && (
          viewMode === 'phone' ? (
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
          )
        )}

        {/* PORTAL ADMIN */}
        {currentApp === 'admin' && (
          <div className="fullscreen-app-wrapper">
            <AdminApp />
          </div>
        )}
      </main>
    </div>
  );
}
