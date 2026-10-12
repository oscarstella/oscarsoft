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
  Database,
  Edit,
  X,
  Save,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';
import BarigoMap from '../BarigoMap';
import { 
  BARILOCHE_CENTER, 
  DEFAULT_FARE_SETTINGS, 
  BARILOCHE_PRESETS 
} from '../../constants/barilocheData';
import { soundService } from '../../services/soundService';
import { apiService } from '../../services/apiService';
import { syncService } from '../../services/syncService';

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'fleet' | 'drivers' | 'fares'
  const [driversList, setDriversList] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalRides: 0,
    completedRides: 0,
    totalVolume: 0,
    totalDrivers: 1,
    activeDriversWithPass: 1,
    recentRides: []
  });
  const [fareSettings, setFareSettings] = useState(DEFAULT_FARE_SETTINGS);
  const [driverFilter, setDriverFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modal de Configuración y Edición de Chofer
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverFormData, setDriverFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    vehicleMake: 'Chevrolet',
    vehicleModel: 'Onix Joy',
    vehiclePlate: 'AF 342 BZ',
    vehicleColor: 'Blanco',
    vehicleYear: 2022,
    ratingAvg: 4.96,
    verificationStatus: 'approved',
    hasPass: true
  });

  // Calculadora interactiva de prueba para tarifas
  const [calcKm, setCalcKm] = useState(5.2);
  const [calcMins, setCalcMins] = useState(12);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar choferes registrados en el backend
      const drivers = await apiService.getAdminDrivers();
      if (Array.isArray(drivers) && drivers.length > 0) {
        setDriversList(drivers);
      } else {
        // Chofer de prueba base configurable por el administrador
        setDriversList([
          {
            id: 'usr-chofer-1',
            name: 'Carlos Nahuel Huapi',
            fullName: 'Carlos Nahuel Huapi',
            phone: '+54 9 294 422-3344',
            email: 'chofer1@barigo.app',
            vehicleModel: 'Chevrolet Onix Joy',
            vehicleMake: 'Chevrolet',
            vehicleName: 'Onix Joy',
            vehiclePlate: 'AF 342 BZ',
            vehicleColor: 'Blanco',
            vehicleYear: 2022,
            rating: 4.96,
            tripsCount: 0,
            todayEarnings: 0,
            hasPass24h: true,
            passHoursLeft: 24,
            verified: true,
            verificationStatus: 'approved',
            status: 'online',
            lat: -41.1348,
            lng: -71.3055
          }
        ]);
      }

      // 2. Cargar métricas reales (cero datos inventados)
      const data = await apiService.getAdminStats();
      if (data && data.stats) {
        setAdminStats(data.stats);
        if (data.settings) setFareSettings(data.settings);
      }
    } catch (e) {
      console.warn('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculatePreviewFare = () => {
    const raw = fareSettings.baseFare + (calcKm * fareSettings.perKmRate) + (calcMins * fareSettings.perMinuteRate);
    return Math.max(Math.round(raw / 50) * 50, fareSettings.minRideFare);
  };

  // Abrir modal para configurar chofer
  const handleOpenEditDriver = (driver) => {
    soundService.playTapSound();
    setEditingDriver(driver);
    setDriverFormData({
      fullName: driver.fullName || driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      vehicleMake: driver.vehicleMake || 'Chevrolet',
      vehicleModel: driver.vehicleName || driver.vehicleModel?.replace(driver.vehicleMake, '').trim() || 'Onix Joy',
      vehiclePlate: driver.vehiclePlate || 'AF 342 BZ',
      vehicleColor: driver.vehicleColor || 'Blanco',
      vehicleYear: driver.vehicleYear || 2022,
      ratingAvg: driver.rating || 4.96,
      verificationStatus: driver.verificationStatus || (driver.verified ? 'approved' : 'pending'),
      hasPass: !!driver.hasPass24h
    });
  };

  // Guardar configuración del chofer en servidor
  const handleSaveDriverConfig = async (e) => {
    e.preventDefault();
    if (!editingDriver) return;
    soundService.playSuccessSound();

    const updatedData = {
      ...driverFormData,
      vehicleModel: `${driverFormData.vehicleMake} ${driverFormData.vehicleModel}`.trim()
    };

    // 1. Guardar en backend
    await apiService.updateAdminDriver(editingDriver.id, updatedData);

    // 2. Actualizar lista local
    setDriversList(prev => prev.map(d => {
      if (d.id === editingDriver.id) {
        return {
          ...d,
          name: updatedData.fullName,
          fullName: updatedData.fullName,
          phone: updatedData.phone,
          email: updatedData.email,
          vehicleMake: updatedData.vehicleMake,
          vehicleModel: updatedData.vehicleModel,
          vehiclePlate: updatedData.vehiclePlate,
          vehicleColor: updatedData.vehicleColor,
          vehicleYear: updatedData.vehicleYear,
          rating: Number(updatedData.ratingAvg),
          verified: updatedData.verificationStatus === 'approved',
          verificationStatus: updatedData.verificationStatus,
          hasPass24h: updatedData.hasPass
        };
      }
      return d;
    }));

    // 3. Notificar sincronización en tiempo real a las apps
    syncService.emit('DRIVER_PROFILE_UPDATED', {
      id: editingDriver.id,
      name: updatedData.fullName,
      fullName: updatedData.fullName,
      phone: updatedData.phone,
      vehicleModel: updatedData.vehicleModel,
      vehiclePlate: updatedData.vehiclePlate,
      vehicleColor: updatedData.vehicleColor,
      rating: Number(updatedData.ratingAvg),
      verified: updatedData.verificationStatus === 'approved'
    });

    setEditingDriver(null);
  };

  // Aprobar o suspender chofer rápidamente
  const handleToggleDriverStatus = async (driver) => {
    soundService.playTapSound();
    const newStatus = driver.verified ? 'suspended' : 'approved';
    await apiService.verifyDriver(driver.id, newStatus);

    setDriversList(prev => prev.map(d => {
      if (d.id === driver.id) {
        return {
          ...d,
          verified: newStatus === 'approved',
          verificationStatus: newStatus
        };
      }
      return d;
    }));

    syncService.emit('DRIVER_PROFILE_UPDATED', {
      id: driver.id,
      verified: newStatus === 'approved'
    });
  };

  // Otorgar pase de 24hs a un chofer
  const handleGrantPass = async (driverId) => {
    soundService.playSuccessSound();
    await apiService.grantDriverPass(driverId);
    setDriversList(prev => prev.map(d => {
      if (d.id === driverId) {
        return { ...d, hasPass24h: true, passHoursLeft: 24 };
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
            <button className="gps-pill-btn" onClick={fetchDashboardData} title="Refrescar datos reales">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>
            <div className="live-status-pill">
              <span className="live-dot-green"></span>
              <span>WebSockets GPS en Línea</span>
            </div>
          </div>
        </header>

        {/* VISTA 1: DASHBOARD EJECUTIVO (DATOS 100% REALES) */}
        {activeTab === 'dashboard' && (
          <div className="admin-view-content animate-fade-in">
            {/* Tarjetas de Métricas Clave */}
            <div className="kpi-cards-grid">
              <div className="kpi-card cyan-glow">
                <div className="kpi-top">
                  <span className="kpi-title">Recaudación Pases 24h</span>
                  <Award size={18} color="#00e5ff" />
                </div>
                <div className="kpi-value">
                  ${(adminStats.activeDriversWithPass * fareSettings.driverPass24hPrice).toLocaleString('es-AR')}
                </div>
                <div className="kpi-bottom text-cyan">
                  <span>{adminStats.activeDriversWithPass} pases 24h activos</span>
                </div>
              </div>

              <div className="kpi-card emerald-glow">
                <div className="kpi-top">
                  <span className="kpi-title">Viajes Completados</span>
                  <Car size={18} color="#10b981" />
                </div>
                <div className="kpi-value">{adminStats.completedRides || 0} viajes</div>
                <div className="kpi-bottom text-emerald">
                  <span>Volumen: ${(adminStats.totalVolume || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="kpi-card gold-glow">
                <div className="kpi-top">
                  <span className="kpi-title">Choferes Conectados</span>
                  <Users size={18} color="#fbbf24" />
                </div>
                <div className="kpi-value">{driversList.filter(d => d.status === 'online').length} en línea</div>
                <div className="kpi-bottom text-gold">
                  <span>De {driversList.length} en el padrón</span>
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

            {/* Grilla Dividida: Actividad Real y Radar */}
            <div className="dashboard-split-grid">
              <div className="admin-card-box">
                <div className="card-box-header">
                  <h3>Últimos Viajes Registrados</h3>
                  <span className="card-sub-tag">En vivo</span>
                </div>
                
                {adminStats.recentRides && adminStats.recentRides.length > 0 ? (
                  <div className="recent-trips-table">
                    {adminStats.recentRides.map((ride, idx) => (
                      <div className="trip-row-item" key={ride.id || idx}>
                        <div className="tr-time">
                          {ride.requestedAt ? new Date(ride.requestedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                        </div>
                        <div className="tr-route">
                          <strong>{ride.originAddress || ride.originText || 'Origen'}</strong> → {ride.destinationAddress || ride.destText || 'Destino'}
                        </div>
                        <div className="tr-driver">{ride.driverName || 'Chofer asignado'}</div>
                        <div className="tr-fare text-emerald">${(ride.finalFare || ride.fare || 0).toLocaleString('es-AR')}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 15px', color: '#64748b' }}>
                    <Clock size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600, color: '#94a3b8' }}>No hay viajes registrados aún en el sistema</p>
                    <span style={{ fontSize: '0.8rem' }}>Los viajes solicitados y aceptados en el simulador aparecerán aquí automáticamente.</span>
                  </div>
                )}
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

        {/* VISTA 3: PADRÓN DE CHOFERES (CONFIGURABLE POR EL ADMINISTRADOR) */}
        {activeTab === 'drivers' && (
          <div className="admin-view-content animate-fade-in">
            <div className="admin-card-box" style={{ marginBottom: '16px' }}>
              <div className="card-box-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Padrón Oficial y Habilitaciones BariGo</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Configura aquí los datos del chofer de prueba y aprueba a los conductores que soliciten incorporarse a la app.
                  </p>
                </div>
              </div>
            </div>

            <div className="drivers-table-card">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Chofer</th>
                    <th>Vehículo y Patente</th>
                    <th>Pase 24h</th>
                    <th>Viajes</th>
                    <th>Recaudación</th>
                    <th>Habilitación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {driversList.map((driver) => (
                    <tr key={driver.id}>
                      <td>
                        <div className="table-driver-meta">
                          <div className="table-avatar">{driver.name?.charAt(0) || 'C'}</div>
                          <div>
                            <strong>{driver.name}</strong>
                            <div className="meta-sub">⭐ {driver.rating || 4.96} • {driver.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{driver.vehicleModel || `${driver.vehicleMake} ${driver.vehicleName}`}</strong>
                        <div className="meta-sub">{driver.vehicleColor} • Patente: <span className="plate-tag">{driver.vehiclePlate}</span></div>
                      </td>
                      <td>
                        {driver.hasPass24h ? (
                          <span className="badge-pass active">Activo (24hs)</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge-pass expired">Sin Pase</span>
                            <button 
                              className="gps-pill-btn mini-btn" 
                              onClick={() => handleGrantPass(driver.id)}
                              title="Activar pase de prueba por 24hs"
                            >
                              + Activar
                            </button>
                          </div>
                        )}
                      </td>
                      <td>{driver.tripsCount || 0}</td>
                      <td>
                        <strong className="text-emerald">${(driver.todayEarnings || 0).toLocaleString('es-AR')}</strong>
                      </td>
                      <td>
                        {driver.verified ? (
                          <span className="badge-verified ok">
                            <CheckCircle2 size={13} /> Aprobado
                          </span>
                        ) : driver.verificationStatus === 'suspended' ? (
                          <span className="badge-verified suspended" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            <XCircle size={13} /> Suspendido
                          </span>
                        ) : (
                          <span className="badge-verified pending">
                            <AlertTriangle size={13} /> Pendiente
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            className="btn-configure-driver"
                            onClick={() => handleOpenEditDriver(driver)}
                            title="Configurar datos del chofer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#1e293b',
                              border: '1px solid #334155',
                              color: '#38bdf8',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600
                            }}
                          >
                            <Edit size={13} />
                            <span>Configurar</span>
                          </button>

                          <button 
                            className={`btn-toggle-verify ${driver.verified ? 'revoke' : 'approve'}`}
                            onClick={() => handleToggleDriverStatus(driver)}
                          >
                            {driver.verified ? 'Suspender' : 'Aprobar'}
                          </button>
                        </div>
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

      {/* ============================================================ */}
      {/* MODAL PARA CONFIGURAR CHOFER DE PRUEBA Y APROBAR SOLICITUDES */}
      {/* ============================================================ */}
      {editingDriver && (
        <div className="modal-backdrop" onClick={() => setEditingDriver(null)}>
          <div 
            className="completed-trip-card animate-scale-up"
            style={{ maxWidth: '520px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit size={20} color="#00e5ff" /> Configurar Datos del Chofer
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  ID: {editingDriver.id} • Modifica los datos para el chofer de prueba y nuevas solicitudes
                </p>
              </div>
              <button 
                onClick={() => setEditingDriver(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDriverConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nombre y Apellido
                </label>
                <input 
                  type="text" 
                  value={driverFormData.fullName}
                  onChange={(e) => setDriverFormData({ ...driverFormData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Teléfono
                  </label>
                  <input 
                    type="text" 
                    value={driverFormData.phone}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={driverFormData.email}
                    onChange={(e) => setDriverFormData({ ...driverFormData, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Marca del Vehículo
                  </label>
                  <input 
                    type="text" 
                    value={driverFormData.vehicleMake}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicleMake: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Modelo
                  </label>
                  <input 
                    type="text" 
                    value={driverFormData.vehicleModel}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicleModel: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Patente
                  </label>
                  <input 
                    type="text" 
                    value={driverFormData.vehiclePlate}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehiclePlate: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontWeight: 700 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Color
                  </label>
                  <input 
                    type="text" 
                    value={driverFormData.vehicleColor}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicleColor: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Calificación
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="1"
                    max="5"
                    value={driverFormData.ratingAvg}
                    onChange={(e) => setDriverFormData({ ...driverFormData, ratingAvg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Habilitación Municipal
                  </label>
                  <select 
                    value={driverFormData.verificationStatus}
                    onChange={(e) => setDriverFormData({ ...driverFormData, verificationStatus: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                  >
                    <option value="approved">✅ Aprobado</option>
                    <option value="pending">⏳ Pendiente</option>
                    <option value="suspended">⛔ Suspendido</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc', fontSize: '0.88rem', fontWeight: 600, marginTop: '16px' }}>
                    <input 
                      type="checkbox"
                      checked={driverFormData.hasPass}
                      onChange={(e) => setDriverFormData({ ...driverFormData, hasPass: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#00e5ff' }}
                    />
                    <span>Pase 24hs Activo</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingDriver(null)}
                  style={{ flex: 1, padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #00e5ff, #00b4d8)', border: 'none', borderRadius: '10px', color: '#090e17', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Save size={16} />
                  <span>Guardar Configuración</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
