import React, { useState } from 'react';
import PhoneFrame from './PhoneFrame';
import PassengerApp from '../passenger/PassengerApp';
import DriverApp from '../driver/DriverApp';
import { ArrowLeftRight, Radio, Sparkles } from 'lucide-react';

export default function DualSimulatorView() {
  const [syncedRide, setSyncedRide] = useState(null);

  return (
    <div className="dual-simulator-container">
      <div className="dual-simulator-banner">
        <div className="banner-pill">
          <Sparkles size={16} color="#00e5ff" />
          <span>Simulador Dual Interactivo • Prueba en vivo Pasajero ⇄ Chofer</span>
        </div>
        <p className="dual-hint">
          Pide un viaje en el teléfono de la izquierda (Pasajero) y mira cómo suena y aparece la alerta de viaje entrante en el teléfono de la derecha (Chofer).
        </p>
      </div>

      <div className="dual-phones-row">
        {/* Teléfono Izquierdo: App Pasajero */}
        <div className="dual-device-col">
          <div className="device-label-badge passenger">
            <span>👤 BariGo Pasajero (App Móvil)</span>
          </div>
          <PhoneFrame appName="BariGo Pasajero">
            <PassengerApp 
              externalRide={syncedRide}
              onRideChange={(ride) => setSyncedRide(ride)}
            />
          </PhoneFrame>
        </div>

        {/* Puente Central de Sincronización */}
        <div className="dual-bridge-indicator">
          <div className="bridge-line"></div>
          <div className="bridge-beacon">
            <ArrowLeftRight size={20} color="#00e5ff" />
          </div>
          <span className="bridge-text">Sincronización GPS</span>
        </div>

        {/* Teléfono Derecho: App Chofer */}
        <div className="dual-device-col">
          <div className="device-label-badge driver">
            <span>🚕 BariGo Chofer (Cockpit Conductor)</span>
          </div>
          <PhoneFrame appName="BariGo Chofer">
            <DriverApp 
              externalRide={syncedRide}
              onRideChange={(ride) => setSyncedRide(ride)}
            />
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
