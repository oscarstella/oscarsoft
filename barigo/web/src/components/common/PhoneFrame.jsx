import React from 'react';

export default function PhoneFrame({ children, appName = 'BariGo Pasajero' }) {
  const currentTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="phone-mockup-wrapper">
      <div className="phone-device-chassis">
        {/* Dynamic Island / Notch */}
        <div className="phone-dynamic-island">
          <div className="camera-lens"></div>
          <div className="sensor-dot"></div>
        </div>

        {/* Status Bar */}
        <div className="phone-status-bar">
          <span className="status-time">{currentTime}</span>
          <div className="status-icons">
            <span className="carrier-name">5G</span>
            <div className="battery-icon">
              <div className="battery-level"></div>
            </div>
          </div>
        </div>

        {/* App Content Screen */}
        <div className="phone-screen-content">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="phone-home-indicator"></div>
      </div>
    </div>
  );
}
