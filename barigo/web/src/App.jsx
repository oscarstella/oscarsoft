import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Car, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  AlertCircle, 
  Radio, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Sliders, 
  Volume2,
  ChevronRight,
  Phone,
  Compass
} from 'lucide-react';
import './App.css';

// Coordenadas emblemáticas de San Carlos de Bariloche
const BARILOCHE_PRESETS = [
  { name: 'Centro Cívico (Mitre)', lat: -41.1335, lng: -71.3103 },
  { name: 'Terminal de Ómnibus', lat: -41.1400, lng: -71.2950 },
  { name: 'Aeropuerto BRC', lat: -41.1512, lng: -71.1578 },
  { name: 'Av. Bustillo Km 4 (Melipal)', lat: -41.1290, lng: -71.3580 },
  { name: 'Cerro Catedral', lat: -41.1712, lng: -71.4398 },
  { name: 'Llao Llao / Circuito Chico', lat: -41.0531, lng: -71.5332 },
  { name: 'Alto Bariloche (Brown & Onelli)', lat: -41.1420, lng: -71.3200 }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('passenger'); // 'passenger' | 'driver' | 'admin'
  
  // Passenger Form State
  const [origin, setOrigin] = useState(BARILOCHE_PRESETS[0]);
  const [destination, setDestination] = useState(BARILOCHE_PRESETS[3]);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'transfer'
  
  // Active Ride State
  const [activeRide, setActiveRide] = useState(null);
  
  // Driver State
  const [driverOnline, setDriverOnline] = useState(true);
  const [hasPass24h, setHasPass24h] = useState(true);
  const [passExpiresInHours, setPassExpiresInHours] = useState(21);
  const [incomingOffer, setIncomingOffer] = useState(null);

  // Admin State
  const [fareSettings, setFareSettings] = useState({
    baseFare: 1200,
    perKmRate: 650,
    perMinuteRate: 120,
    driverPass24hPrice: 4500,
    minRideFare: 2000,
    nightMultiplier: 1.2
  });

  // Sintetizador de voz en acento argentino (Web Speech API es-AR)
  const speakVoiceAR = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Intentar buscar voz argentina si está instalada en el sistema
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang === 'es-AR' || v.lang.includes('AR'));
      if (arVoice) utterance.voice = arVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Cálculo de distancia euclidiana aproximada en Bariloche
  const calculateDistanceKm = (p1, p2) => {
    const dLat = (p2.lat - p1.lat) * 111;
    const dLng = (p2.lng - p1.lng) * 85;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return Number(dist.toFixed(1));
  };

  const distanceKm = calculateDistanceKm(origin, destination);
  const estimatedMins = Math.max(Math.ceil((distanceKm / 32) * 60) + 3, 5);

  const calculateFare = () => {
    const raw = fareSettings.baseFare + (distanceKm * fareSettings.perKmRate) + (estimatedMins * fareSettings.perMinuteRate);
    const total = Math.max(raw, fareSettings.minRideFare);
    return Math.round(total / 50) * 50;
  };

  const currentFare = calculateFare();

  // Solicitar viaje (Pasajero)
  const handleRequestRide = () => {
    const ride = {
      id: 'ride-' + Date.now().toString().slice(-4),
      originName: origin.name,
      destName: destination.name,
      distanceKm,
      estimatedMins,
      fare: currentFare,
      paymentMethod,
      status: 'requested', // 'requested' | 'accepted' | 'arriving' | 'in_progress' | 'completed'
      driver: null
    };

    setActiveRide(ride);
    speakVoiceAR("Buscando choferes cercanos en Bariloche.");

    // Simular recepción de oferta en el portal del chofer
    setIncomingOffer(ride);
  };

  // Aceptar viaje (Chofer)
  const handleAcceptRide = () => {
    if (!hasPass24h) {
      alert("Necesitas tener un Pase de 24hs activo para aceptar viajes.");
      return;
    }

    const assignedDriver = {
      name: 'Carlos Nahuel Huapi',
      vehicle: 'Chevrolet Onix Joy (Blanco)',
      plate: 'AF 342 BZ',
      rating: 4.95,
      phone: '+54 9 294 422-3344'
    };

    const updated = {
      ...incomingOffer,
      status: 'accepted',
      driver: assignedDriver
    };

    setActiveRide(updated);
    setIncomingOffer(null);
    speakVoiceAR(`¡Viaje aceptado! Pasajero en ${updated.originName}. Tarifa neta ${updated.fare} pesos.`);
  };

  // Avanzar estado del viaje
  const handleAdvanceStatus = () => {
    if (!activeRide) return;

    if (activeRide.status === 'accepted') {
      setActiveRide({ ...activeRide, status: 'arriving' });
      speakVoiceAR("Tu chofer ha llegado al punto de recogida.");
    } else if (activeRide.status === 'arriving') {
      setActiveRide({ ...activeRide, status: 'in_progress' });
      speakVoiceAR("Viaje iniciado hacia el destino. Que tengas un buen viaje.");
    } else if (activeRide.status === 'in_progress') {
      setActiveRide({ ...activeRide, status: 'completed' });
      speakVoiceAR(`Has llegado a destino. Total a cobrar: ${activeRide.fare} pesos.`);
    } else if (activeRide.status === 'completed') {
      setActiveRide(null);
    }
  };

  // Comprar Pase 24hs
  const handleBuyPass = () => {
    setHasPass24h(true);
    setPassExpiresInHours(24);
    alert("¡Pase de 24 horas activado con éxito! Pago verificado.");
    speakVoiceAR("Pase de 24 horas activado. Ya estás habilitado para recibir viajes.");
  };

  return (
    <div className="barigo-app">
      {/* Header */}
      <header className="barigo-header">
        <div className="header-container">
          <div className="brand-wrapper">
            <span className="brand-logo">
              <span className="logo-b">Bari</span><span className="logo-go">Go</span>
            </span>
            <span className="brand-badge">Bariloche • 100% Local</span>
          </div>

          <nav className="nav-tabs">
            <button 
              className={`tab-btn ${currentTab === 'passenger' ? 'active' : ''}`}
              onClick={() => setCurrentTab('passenger')}
            >
              <Navigation size={15} />
              <span>Pedir Viaje</span>
            </button>
            <button 
              className={`tab-btn ${currentTab === 'driver' ? 'active' : ''}`}
              onClick={() => setCurrentTab('driver')}
            >
              <Car size={15} />
              <span>Portal Chofer</span>
            </button>
            <button 
              className={`tab-btn ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentTab('admin')}
            >
              <Sliders size={15} />
              <span>Panel Admin</span>
            </button>
          </nav>

          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Servidor Node + WebSockets Activo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="mode-grid">
          {/* LADO IZQUIERDO: Mapa y Radar Interactivo de Bariloche */}
          <div className="map-card">
            <div className="map-header">
              <div className="map-title">
                <Compass size={18} color="#06b6d4" />
                <span>Radar en Tiempo Real • San Carlos de Bariloche</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                ● 2 Choferes en línea
              </span>
            </div>

            <div className="map-container">
              {/* Mapa Vectorial Representativo de Bariloche (Lago Nahuel Huapi + Rutas) */}
              <svg className="bariloche-map-svg" viewBox="0 0 600 400" preserveAspectRatio="none">
                {/* Lago Nahuel Huapi */}
                <path 
                  className="map-lake" 
                  d="M0,0 L600,0 L600,140 Q450,110 320,130 Q200,90 100,150 L0,170 Z" 
                />
                <text x="340" y="70" fill="#1e3a5f" fontSize="18" fontWeight="bold" fontFamily="sans-serif">
                  Lago Nahuel Huapi
                </text>

                {/* Av. Bustillo (Costanera) */}
                <path 
                  className="map-road" 
                  d="M0,170 Q120,150 250,140 T420,160 T600,190" 
                />
                
                {/* Ruta al Cerro Catedral */}
                <path 
                  className="map-road" 
                  d="M250,140 Q220,240 160,330" 
                />

                {/* Ruta al Aeropuerto / Circunvalación */}
                <path 
                  className="map-road" 
                  d="M420,160 Q510,210 590,240" 
                />

                {/* Ruta activa del viaje si existe */}
                {activeRide && (
                  <path 
                    className="map-route-active" 
                    d="M320,165 Q250,150 180,260" 
                  />
                )}

                {/* Marcador Origen */}
                <circle cx="320" cy="165" r="9" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                <text x="334" y="170" fill="#ffffff" fontSize="12" fontWeight="600">Origen</text>

                {/* Marcador Destino */}
                <circle cx="180" cy="260" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                <text x="194" y="265" fill="#ffffff" fontSize="12" fontWeight="600">Destino</text>

                {/* Chofer 1 (Carlos - Onix) */}
                <g className="driver-car-marker" transform="translate(300, 155)">
                  <circle cx="0" cy="0" r="14" fill="#6366f1" opacity="0.3" />
                  <circle cx="0" cy="0" r="9" fill="#6366f1" />
                  <text x="-4" y="4" fill="#ffffff" fontSize="10">🚕</text>
                </g>

                {/* Chofer 2 (Esteban - Etios) */}
                <g className="driver-car-marker" transform="translate(140, 180)">
                  <circle cx="0" cy="0" r="14" fill="#10b981" opacity="0.3" />
                  <circle cx="0" cy="0" r="9" fill="#10b981" />
                  <text x="-4" y="4" fill="#ffffff" fontSize="10">🚕</text>
                </g>
              </svg>

              <div className="map-overlay-badge">
                <Radio size={14} color="#10b981" />
                <span>Geolocalización GPS por WebSockets nativos</span>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: PANELES INTERACTIVOS SEGÚN EL ROL */}
          <div>
            {/* 1. MODO PASAJERO */}
            {currentTab === 'passenger' && (
              <div className="panel-card">
                <h2 className="panel-title">
                  <Navigation size={22} color="#06b6d4" />
                  <span>Pedir un Viaje en Bariloche</span>
                </h2>

                {activeRide ? (
                  <div className="active-ride-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`ride-status-badge status-${activeRide.status}`}>
                        ● {activeRide.status === 'requested' && 'Buscando chofer...'}
                        {activeRide.status === 'accepted' && 'Chofer Confirmado'}
                        {activeRide.status === 'arriving' && 'Chofer en la puerta'}
                        {activeRide.status === 'in_progress' && 'En Viaje a Destino'}
                        {activeRide.status === 'completed' && 'Viaje Finalizado'}
                      </span>
                      <strong style={{ color: '#06b6d4', fontSize: '1.2rem' }}>
                        ${activeRide.fare} ARS
                      </strong>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                        <strong>Desde:</strong> {activeRide.originName}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                        <strong>Hasta:</strong> {activeRide.destName}
                      </div>
                    </div>

                    {activeRide.driver && (
                      <div className="driver-detail-box">
                        <div>
                          <strong style={{ color: 'white', display: 'block' }}>{activeRide.driver.name}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                            {activeRide.driver.vehicle} • {activeRide.driver.plate}
                          </span>
                        </div>
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⭐ {activeRide.driver.rating}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn-book" 
                        style={{ flex: 1, padding: '10px' }}
                        onClick={handleAdvanceStatus}
                      >
                        {activeRide.status === 'completed' ? 'Pedir otro viaje' : 'Simular siguiente estado'}
                      </button>
                      {activeRide.status !== 'completed' && (
                        <button 
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px 16px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}
                          onClick={() => setActiveRide(null)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Selector de Origen */}
                    <div className="input-group">
                      <label className="input-label">
                        <MapPin size={14} color="#06b6d4" />
                        <span>Punto de Recogida (Origen)</span>
                      </label>
                      <div className="presets-grid">
                        {BARILOCHE_PRESETS.slice(0, 4).map((p, idx) => (
                          <button 
                            key={idx} 
                            className="preset-chip"
                            onClick={() => setOrigin(p)}
                            style={{ borderColor: origin.name === p.name ? '#06b6d4' : undefined }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={origin.name} 
                        readOnly 
                      />
                    </div>

                    {/* Selector de Destino */}
                    <div className="input-group">
                      <label className="input-label">
                        <MapPin size={14} color="#10b981" />
                        <span>Destino</span>
                      </label>
                      <div className="presets-grid">
                        {BARILOCHE_PRESETS.slice(2).map((p, idx) => (
                          <button 
                            key={idx} 
                            className="preset-chip"
                            onClick={() => setDestination(p)}
                            style={{ borderColor: destination.name === p.name ? '#10b981' : undefined }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={destination.name} 
                        readOnly 
                      />
                    </div>

                    {/* Desglose de Tarifa */}
                    <div className="fare-box">
                      <div className="fare-row">
                        <span>Distancia estimada:</span>
                        <strong>{distanceKm} km</strong>
                      </div>
                      <div className="fare-row">
                        <span>Tiempo de viaje aprox.:</span>
                        <strong>{estimatedMins} min</strong>
                      </div>
                      <div className="fare-row">
                        <span>Bajada de bandera Bariloche:</span>
                        <span>${fareSettings.baseFare}</span>
                      </div>
                      <div className="fare-row fare-total-row">
                        <span>Tarifa Final Estimada:</span>
                        <span className="fare-total-val">${currentFare} ARS</span>
                      </div>
                    </div>

                    {/* Botón de Confirmación */}
                    <button className="btn-book" onClick={handleRequestRide}>
                      <Car size={18} />
                      <span>Solicitar Viaje Ahora</span>
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 2. MODO CHOFER */}
            {currentTab === 'driver' && (
              <div className="panel-card">
                <h2 className="panel-title">
                  <Car size={22} color="#10b981" />
                  <span>Portal Chofer BariGo</span>
                </h2>

                {/* Pase 24 Horas */}
                <div className="pass-card">
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Pase Diario de Conducción
                    </span>
                    <h3 style={{ fontSize: '1.1rem', color: hasPass24h ? '#34d399' : '#f87171' }}>
                      {hasPass24h ? `● Activo (Vence en ${passExpiresInHours}h)` : '● Inactivo (Requiere Pase)'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0' }}>
                      0% de comisiones por viaje.
                    </p>
                  </div>
                  {!hasPass24h ? (
                    <button 
                      className="btn-book" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      onClick={handleBuyPass}
                    >
                      Pagar $4.500
                    </button>
                  ) : (
                    <span className="pass-price">$4.500</span>
                  )}
                </div>

                {/* Conexión al Radar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <strong>Estado del Chofer</strong>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                      {driverOnline ? 'Conectado y recibiendo solicitudes en Bariloche' : 'Desconectado'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setDriverOnline(!driverOnline)}
                    style={{
                      background: driverOnline ? '#10b981' : '#64748b',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700
                    }}
                  >
                    {driverOnline ? 'Online' : 'Offline'}
                  </button>
                </div>

                {/* Viaje entrante para el chofer */}
                {incomingOffer && (
                  <div style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🚨 ¡NUEVO VIAJE ENTRANTE!</span>
                      <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>${incomingOffer.fare} ARS</strong>
                    </div>
                    <p style={{ fontSize: '0.88rem', margin: '4px 0' }}><strong>Desde:</strong> {incomingOffer.originName}</p>
                    <p style={{ fontSize: '0.88rem', margin: '4px 0' }}><strong>Hasta:</strong> {incomingOffer.destName}</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Distancia: {incomingOffer.distanceKm} km • {incomingOffer.estimatedMins} min</p>

                    <button 
                      className="btn-book" 
                      style={{ width: '100%', marginTop: '12px' }}
                      onClick={handleAcceptRide}
                    >
                      Aceptar Viaje
                    </button>
                  </div>
                )}

                {/* Datos del Vehículo Habilitado */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.92rem', marginBottom: '8px', color: '#e2e8f0' }}>Vehículo Habilitado en Bariloche:</h4>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '2px 0' }}>• Chevrolet Onix Joy (Blanco) • Patente AF 342 BZ</p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '2px 0' }}>• Cadenas de nieve: Verificado ✅</p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '2px 0' }}>• RTO / VTV Río Negro: Al día ✅</p>
                </div>
              </div>
            )}

            {/* 3. MODO ADMIN */}
            {currentTab === 'admin' && (
              <div className="panel-card">
                <h2 className="panel-title">
                  <Sliders size={22} color="#6366f1" />
                  <span>Panel Administrador de BariGo</span>
                </h2>

                <div className="stats-grid">
                  <div className="stat-box">
                    <span className="stat-box-num">184</span>
                    <span className="stat-box-lbl">Viajes Completados</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-num">$828.000</span>
                    <span className="stat-box-lbl">Volumen Total ARS</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-num">14</span>
                    <span className="stat-box-lbl">Choferes con Pase Activo</span>
                  </div>
                </div>

                {/* Configuración de Tarifas */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Configuración de Tarifas Urbanas:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Bajada de Bandera ($)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={fareSettings.baseFare}
                        onChange={(e) => setFareSettings({ ...fareSettings, baseFare: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Precio por Km ($)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={fareSettings.perKmRate}
                        onChange={(e) => setFareSettings({ ...fareSettings, perKmRate: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Pase Chofer 24hs ($)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={fareSettings.driverPass24hPrice}
                        onChange={(e) => setFareSettings({ ...fareSettings, driverPass24hPrice: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tarifa Mínima ($)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={fareSettings.minRideFare}
                        onChange={(e) => setFareSettings({ ...fareSettings, minRideFare: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed #6366f1', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#c7d2fe' }}>
                  🛡️ Panel de control soberano en tu propio servidor Contabo con base de datos local y WebSockets Socket.io.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
