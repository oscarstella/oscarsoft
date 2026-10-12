import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  MapPin, 
  Users, 
  Car, 
  Sliders, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  AlertTriangle,
  Award,
  RefreshCw,
  Eye,
  Database
} from 'lucide-react';
import BarigoMap from '../BarigoMap';
import { 
  BARILOCHE_CENTER, 
  INITIAL_DRIVERS, 
  DEFAULT_FARE_SETTINGS, 
  BARILOCHE_PRESETS 
} from '../../constants/barilocheData';
import { soundService } from '../../services/soundService';
import { apiService } from '../../services/apiService';

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'fleet' | 'drivers' | 'fares'
  const [driversList, setDriversList] = useState(INITIAL_DRIVERS);
  const [fareSettings, setFareSettings] = useState(DEFAULT_FARE_SETTINGS);
  const [driverFilter, setDriverFilter] = useState('all');

  // Calculadora interactiva de prueba para tarifas
  const [calcKm, setCalcKm] = useState(5.2);
  const [calcMins, setCalcMins] = useState(12);

  useEffect(() => {
    // Cargar estadísticas y choferes desde el backend real si está online
    apiService.getOnlineDrivers().then(drivers => {
      if (drivers && drivers.length > 0) {
        setDriversList(drivers);
      }
    });
  }, []);

  const calculatePreviewFare = () => {
    const raw = fareSettings.baseFare + (calcKm * fareSettings.perKmRate) + (calcMins * fareSettings.perMinuteRate);
    return Math.max(Math.round(raw / 50) * 50, fareSettings.minRideFare);
  };

  const toggleDriverApproval = (driverId) => {
    soundService.playTapSound();
    setDriversList(prev => prev.map(d => {
      if (d.id === driverId) {
        return { ...d, verified: !d.verified };
      }
      return d;
    }));
  };

  const filteredDrivers = driversList.filter(d => {
    if (driverFilter === 'all') return true;
    return d.status === driverFilter;
  });

  return (
    <div className="admin-app-layout">
      {/* 1. SIDEBAR CORPORATIVO */}
      <aside className="admin-sidebar">
        <div className="admin-brand-box">
          <div className="admin-shield-icon">
            <ShieldCheck size={22} color="#00e5ff" />
          </div>
          <div className="admin-brand-text">
            <span className="ab-title">BariGo Admin</span>
            <span className="ab-sub">San Carlos de Bariloche</span>
          </div>
        </div>

        <nav className="admin-nav-links">
          <button 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { soundService.playTapSound(); setActiveTab('dashboard'); }}
          >
            <BarChart3 size={18} />
            <span>Dashboard Ejecutivo</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => { soundService.playTapSound(); setActiveTab('fleet'); }}
          >
            <MapPin size={18} />
            <span>Mapa de Flota en Vivo</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'drivers' ? 'active' : ''}`}
            onClick={() => { soundService.playTapSound(); setActiveTab('drivers'); }}
          >
            <Car size={18} />
            <span>Padrón de Choferes</span>
            <span className="badge-count">{driversList.length}</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'fares' ? 'active' : ''}`}
            onClick={() => { soundService.playTapSound(); setActiveTab('fares'); }}
          >
            <Sliders size={18} />
            <span>Parámetros y Tarifas</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">A</div>
            <div className="admin-user-meta">
              <strong>Oscar Stella</strong>
              <span>Administrador General</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="admin-main-area">
        {/* HEADER DE CABECERA */}
        <header className="admin-topbar">
          <div className="topbar-title-group">
            <h1 className="topbar-page-title">
              {activeTab === 'dashboard' && 'Dashboard de Control Operativo'}
              {activeTab === 'fleet' && 'Monitoreo de Flota en Tiempo Real'}
              {activeTab === 'drivers' && 'Padrón de Choferes Habilitados'}
              {activeTab === 'fares' && 'Parámetros Oficiales de Tarifación y Pases 24h'}
            </h1>
            <span className="topbar-date">San Carlos de Bariloche • Sistema Producción Activo</span>
          </div>

          <div className="topbar-actions">
            <div className="live-status-pill">
              <span className="live-dot-green"></span>
              <span>WebSockets GPS en Línea</span>
            </div>
          </div>
        </header>

        {/* VISTA 1: DASHBOARD EJECUTIVO */}
        {activeTab === 'dashboard' && (
          <div className="admin-view-content animate-fade-in">
            {/* Tarjetas de Métricas Clave */}
            <div className="kpi-cards-grid">
              <div className="kpi-card cyan-glow">
                <div className="kpi-top">
                  <span className="kpi-title">Recaudación Pases 24h</span>
                  <Award size={18} color="#00e5ff" />
                </div>
                <div className="kpi-value">$126.000</div>
                <div className="kpi-bottom text-cyan">
                  <span>28 pases activos en Bariloche</span>
                </div>
              </div>

              <div className="kpi-card emerald-glow">
                <div className="kpi-top">
                  <span className="kpi-title">Viajes Completados Hoy</span>
                  <Car size={18} color="#10b981" />
                </div>
                <div className="kpi-value">142 viajes</div>
                <div className="kpi-bottom text-emerald">
                  <span>En Mitre, Bustillo, Melipal y Catedral</span>
                </div>
              </div>

              <div className="kpi-card gold-glow">
                <div className="kpi-top">
                  <span className="kpi-title">Choferes Conectados</span>
                  <Users size={18} color="#fbbf24" />
                </div>
                <div className="kpi-value">{driversList.filter(d => d.status === 'online').length} en línea</div>
                <div className="kpi-bottom text-gold">
                  <span>De {driversList.length} registrados</span>
                </div>
              </div>

              <div className="kpi-card purple-glow">
                <div className="kpi-top">
                  <span className="kpi-title">Comisión a Terceros</span>
                  <ShieldCheck size={18} color="#a855f7" />
                </div>
                <div className="kpi-value">$0 (0%)</div>
                <div className="kpi-bottom text-purple">
                  <span>100% ganancia neta para conductores</span>
                </div>
              </div>
            </div>

            {/* Grilla Dividida: Actividad Reciente y Mapa Resumido */}
            <div className="dashboard-split-grid">
              <div className="admin-card-box">
                <div className="card-box-header">
                  <h3>Últimos Viajes Registrados</h3>
                  <span className="card-sub-tag">En vivo</span>
                </div>
                <div className="recent-trips-table">
                  <div className="trip-row-item">
                    <div className="tr-time">11:38</div>
                    <div className="tr-route">
                      <strong>Centro Cívico</strong> → Av. Bustillo Km 4
                    </div>
                    <div className="tr-driver">Carlos N. (Onix)</div>
                    <div className="tr-fare text-emerald">$2.850</div>
                  </div>
                  <div className="trip-row-item">
                    <div className="tr-time">11:24</div>
                    <div className="tr-route">
                      <strong>Terminal de Ómnibus</strong> → Catedral Base
                    </div>
                    <div className="tr-driver">Matías H. (Duster 4x4)</div>
                    <div className="tr-fare text-emerald">$4.800</div>
                  </div>
                  <div className="trip-row-item">
                    <div className="tr-time">11:10</div>
                    <div className="tr-route">
                      <strong>Onelli y Brown</strong> → Melipal
                    </div>
                    <div className="tr-driver">Esteban S. (Etios)</div>
                    <div className="tr-fare text-emerald">$3.100</div>
                  </div>
                  <div className="trip-row-item">
                    <div className="tr-time">10:52</div>
                    <div className="tr-route">
                      <strong>Mitre 250</strong> → Aeropuerto BRC
                    </div>
                    <div className="tr-driver">Luciana O. (Virtus)</div>
                    <div className="tr-fare text-emerald">$7.200</div>
                  </div>
                </div>
              </div>

              <div className="admin-card-box">
                <div className="card-box-header">
                  <h3>Radar de Vehículos en Bariloche</h3>
                  <span className="card-sub-tag">{driversList.length} choferes</span>
                </div>
                <div className="dashboard-mini-map-box">
                  <BarigoMap 
                    drivers={driversList}
                    center={BARILOCHE_CENTER}
                    zoom={13}
                    className="mini-admin-map"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: MAPA DE FLOTA EN VIVO */}
        {activeTab === 'fleet' && (
          <div className="admin-view-content animate-fade-in fleet-view">
            <div className="fleet-controls-bar">
              <div className="filter-chips-group">
                <button 
                  className={`chip-btn ${driverFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDriverFilter('all')}
                >
                  Todos ({driversList.length})
                </button>
                <button 
                  className={`chip-btn ${driverFilter === 'online' ? 'active' : ''}`}
                  onClick={() => setDriverFilter('online')}
                >
                  ● En Línea ({driversList.filter(d => d.status === 'online').length})
                </button>
                <button 
                  className={`chip-btn ${driverFilter === 'busy' ? 'active' : ''}`}
                  onClick={() => setDriverFilter('busy')}
                >
                  ● En Viaje ({driversList.filter(d => d.status === 'busy').length})
                </button>
              </div>
            </div>

            <div className="fleet-full-map-box">
              <BarigoMap 
                drivers={filteredDrivers}
                center={BARILOCHE_CENTER}
                zoom={14}
                className="fleet-map"
              />
            </div>
          </div>
        )}

        {/* VISTA 3: GESTIÓN DE CHOFERES */}
        {activeTab === 'drivers' && (
          <div className="admin-view-content animate-fade-in">
            <div className="drivers-table-card">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Chofer</th>
                    <th>Vehículo y Patente</th>
                    <th>Pase 24h</th>
                    <th>Viajes Realizados</th>
                    <th>Recaudación Hoy</th>
                    <th>Habilitación Municipal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {driversList.map((driver) => (
                    <tr key={driver.id}>
                      <td>
                        <div className="table-driver-meta">
                          <div className="table-avatar">{driver.name.charAt(0)}</div>
                          <div>
                            <strong>{driver.name}</strong>
                            <div className="meta-sub">⭐ {driver.rating} • {driver.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{driver.vehicleModel}</strong>
                        <div className="meta-sub">{driver.vehicleColor} • Patente: <span className="plate-tag">{driver.vehiclePlate}</span></div>
                      </td>
                      <td>
                        {driver.hasPass24h ? (
                          <span className="badge-pass active">Quedan {driver.passHoursLeft}hs</span>
                        ) : (
                          <span className="badge-pass expired">Sin Pase</span>
                        )}
                      </td>
                      <td>{driver.tripsCount} viajes</td>
                      <td>
                        <strong className="text-emerald">${driver.todayEarnings.toLocaleString('es-AR')}</strong>
                      </td>
                      <td>
                        {driver.verified ? (
                          <span className="badge-verified ok">
                            <CheckCircle2 size={13} /> Aprobado
                          </span>
                        ) : (
                          <span className="badge-verified pending">
                            <AlertTriangle size={13} /> Pendiente
                          </span>
                        )}
                      </td>
                      <td>
                        <button 
                          className={`btn-toggle-verify ${driver.verified ? 'revoke' : 'approve'}`}
                          onClick={() => toggleDriverApproval(driver.id)}
                        >
                          {driver.verified ? 'Suspender' : 'Aprobar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA 4: CONFIGURACIÓN DE TARIFAS */}
        {activeTab === 'fares' && (
          <div className="admin-view-content animate-fade-in">
            <div className="fares-grid-split">
              {/* Formulario de Parámetros */}
              <div className="admin-card-box">
                <div className="card-box-header">
                  <h3>Tarifas Oficiales Bariloche</h3>
                  <span className="card-sub-tag">0% Comisión Chofer</span>
                </div>

                <div className="fare-inputs-grid">
                  <div className="fare-input-field">
                    <label>Bajada de Bandera (ARS)</label>
                    <input 
                      type="number" 
                      value={fareSettings.baseFare}
                      onChange={(e) => setFareSettings({ ...fareSettings, baseFare: Number(e.target.value) })}
                    />
                  </div>

                  <div className="fare-input-field">
                    <label>Tarifa por Kilómetro (ARS/km)</label>
                    <input 
                      type="number" 
                      value={fareSettings.perKmRate}
                      onChange={(e) => setFareSettings({ ...fareSettings, perKmRate: Number(e.target.value) })}
                    />
                  </div>

                  <div className="fare-input-field">
                    <label>Tarifa por Minuto (ARS/min)</label>
                    <input 
                      type="number" 
                      value={fareSettings.perMinuteRate}
                      onChange={(e) => setFareSettings({ ...fareSettings, perMinuteRate: Number(e.target.value) })}
                    />
                  </div>

                  <div className="fare-input-field">
                    <label>Pase 24 Horas Chofer (ARS)</label>
                    <input 
                      type="number" 
                      value={fareSettings.driverPass24hPrice}
                      onChange={(e) => setFareSettings({ ...fareSettings, driverPass24hPrice: Number(e.target.value) })}
                    />
                  </div>

                  <div className="fare-input-field">
                    <label>Tarifa Mínima por Viaje (ARS)</label>
                    <input 
                      type="number" 
                      value={fareSettings.minRideFare}
                      onChange={(e) => setFareSettings({ ...fareSettings, minRideFare: Number(e.target.value) })}
                    />
                  </div>

                  <div className="fare-input-field">
                    <label>Multiplicador Nocturno / Nieve</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={fareSettings.nightMultiplier}
                      onChange={(e) => setFareSettings({ ...fareSettings, nightMultiplier: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <button 
                  className="save-fares-btn"
                  onClick={async () => {
                    soundService.playSuccessSound();
                    await apiService.updateFareSettings(fareSettings);
                    alert("¡Tarifas actualizadas en servidor exitosamente!");
                  }}
                >
                  Guardar Tarifas en Servidor
                </button>
              </div>

              {/* Simulador Interactivo */}
              <div className="admin-card-box">
                <div className="card-box-header">
                  <h3>Cálculo Dinámico de Cotización</h3>
                  <span className="card-sub-tag">Comprobación en vivo</span>
                </div>

                <div className="simulator-controls">
                  <div className="sim-control-item">
                    <label>Distancia a calcular: {calcKm} km</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="35" 
                      step="0.5"
                      value={calcKm} 
                      onChange={(e) => setCalcKm(Number(e.target.value))} 
                    />
                  </div>

                  <div className="sim-control-item">
                    <label>Tiempo estimado: {calcMins} minutos</label>
                    <input 
                      type="range" 
                      min="3" 
                      max="60" 
                      step="1"
                      value={calcMins} 
                      onChange={(e) => setCalcMins(Number(e.target.value))} 
                    />
                  </div>

                  <div className="sim-result-box">
                    <span className="sim-label">Tarifa Resultante al Pasajero:</span>
                    <span className="sim-fare">${calculatePreviewFare()}</span>
                    <span className="sim-detail">
                      Bajada: ${fareSettings.baseFare} + Distancia: ${Math.round(calcKm * fareSettings.perKmRate)} + Tiempo: ${Math.round(calcMins * fareSettings.perMinuteRate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
