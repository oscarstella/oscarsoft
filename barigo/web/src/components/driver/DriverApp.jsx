import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Power, 
  Award, 
  Clock, 
  DollarSign, 
  MapPin, 
  Navigation, 
  Compass, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  TrendingUp,
  Crosshair,
  Radio,
  X
} from 'lucide-react';
import BarigoMap from '../BarigoMap';
import { BARILOCHE_CENTER, DEFAULT_FARE_SETTINGS } from '../../constants/barilocheData';
import { soundService } from '../../services/soundService';
import { voiceService } from '../../services/voiceService';
import { syncService } from '../../services/syncService';
import { gpsService } from '../../services/gpsService';
import { apiService } from '../../services/apiService';
import { getBarilocheWeather } from '../../services/weatherService';
import { getStreetRoute } from '../../services/routingService';
import DriverGpsView from './DriverGpsView';

// Limpiar sufijos largos para anuncios de voz más humanos
function cleanText(txt) {
  if (!txt) return '';
  return txt
    .replace(/,?\s*(?:San Carlos de )?Bariloche/gi, '')
    .replace(/,?\s*Río Negro/gi, '')
    .replace(/,?\s*Argentina/gi, '')
    .trim();
}

export default function DriverApp({ externalRide, onRideChange, viewMode = 'phone' }) {
  // Datos del Conductor
  const [driverLoc, setDriverLoc] = useState({
    lat: -41.1348,
    lng: -71.3055,
    speed: 0,
    heading: 0,
    isRealGps: false
  });

  const [driverProfile, setDriverProfile] = useState({
    id: 'usr-chofer-1',
    name: 'Carlos Nahuel Huapi',
    rating: 4.96,
    tripsCount: 0,
    vehicleModel: 'Chevrolet Onix Joy',
    vehicleColor: 'Blanco',
    vehiclePlate: 'AF 342 BZ',
    phone: '+54 9 294 422-3344',
    lat: -41.1348,
    lng: -71.3055
  });

  const [isOnline, setIsOnline] = useState(true);
  const [hasPass24h, setHasPass24h] = useState(true);
  const [passHoursLeft, setPassHoursLeft] = useState(24);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayTripsCount, setTodayTripsCount] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Estado del Viaje
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [activeRide, setActiveRide] = useState(externalRide || null);
  const [countdownSeconds, setCountdownSeconds] = useState(15);
  const [passModalOpen, setPassModalOpen] = useState(false);

  // Turn-by-Turn Phase: 'to_pickup' | 'at_pickup' | 'to_dest' | 'completed'
  const [navPhase, setNavPhase] = useState('to_pickup');

  // Ruteo en vivo calle por calle y navegación GPS para el chofer
  const [navRoutePolyline, setNavRoutePolyline] = useState([]);
  const [navEta, setNavEta] = useState({ mins: 3, km: 1.2 });

  const [weatherInfo, setWeatherInfo] = useState(null);

  // Clima y Demora de Tráfico Bariloche
  useEffect(() => {
    getBarilocheWeather().then(w => {
      if (w) setWeatherInfo(w);
    });
  }, []);

  // Cálculo en tiempo real de ruta por calles (OSRM) para el chofer
  useEffect(() => {
    if (!activeRide) {
      setNavRoutePolyline([]);
      return;
    }

    if (navPhase === 'to_pickup') {
      const pLat = Number(activeRide.originCoord?.lat || activeRide.originLat);
      const pLng = Number(activeRide.originCoord?.lng || activeRide.originLng);
      if (pLat && pLng && driverLoc.lat && driverLoc.lng) {
        getStreetRoute(driverLoc.lat, driverLoc.lng, pLat, pLng).then(res => {
          if (res && res.points) {
            setNavRoutePolyline(res.points);
            setNavEta({ mins: res.durationMin, km: res.distanceKm });
          }
        });
      }
    } else if (navPhase === 'to_dest') {
      const fromLat = driverLoc.lat;
      const fromLng = driverLoc.lng;
      const dLat = Number(activeRide.destCoord?.lat || activeRide.destinationLat);
      const dLng = Number(activeRide.destCoord?.lng || activeRide.destinationLng);
      if (fromLat && fromLng && dLat && dLng) {
        getStreetRoute(fromLat, fromLng, dLat, dLng).then(res => {
          if (res && res.points) {
            setNavRoutePolyline(res.points);
            setNavEta({ mins: res.durationMin, km: res.distanceKm });
          }
        });
      }
    }
  }, [activeRide, navPhase, driverLoc.lat, driverLoc.lng]);

  // 1. Geolocalización GPS Real del Conductor
  useEffect(() => {
    // Obtener posición inicial
    gpsService.getCurrentPosition().then(pos => {
      setDriverLoc({
        lat: pos.lat,
        lng: pos.lng,
        speed: 0,
        heading: pos.heading || 0,
        isRealGps: pos.isRealGps
      });
    });

    // Iniciar tracking GPS en vivo si está conectado
    if (isOnline) {
      gpsService.startTracking((coords) => {
        setDriverLoc({
          lat: coords.lat,
          lng: coords.lng,
          speed: coords.speed || 0,
          heading: coords.heading || 0,
          isRealGps: true
        });

        // Transmitir al servidor WebSockets real
        const socket = apiService.getSocket();
        if (socket) {
          socket.emit('driver:update_location', {
            driverId: driverProfile.id,
            lat: coords.lat,
            lng: coords.lng,
            heading: coords.heading,
            speed: coords.speed,
            activeRideId: activeRide?.id
          });
        }
      });
    } else {
      gpsService.stopTracking();
    }

    return () => {
      gpsService.stopTracking();
    };
  }, [isOnline, activeRide]);

  // Sincronización en tiempo real por WebSockets (CERO DEMOS / CERO MOCKS)
  useEffect(() => {
    const socket = apiService.getSocket();
    if (socket) {
      socket.emit('driver:register', { driverId: driverProfile.id });
      socket.emit('driver:update_location', {
        driverId: driverProfile.id,
        lat: driverLoc.lat,
        lng: driverLoc.lng,
        isOnline: true
      });

      const handleNewAvailable = (data) => {
        if (!isOnline || !hasPass24h || activeRide) return;
        const incomingRide = data.ride || {};
        const incomingPassenger = data.passenger || {};

        const offer = {
          id: incomingRide.id,
          passengerName: incomingPassenger.fullName || incomingRide.passengerName || 'Oscar Stella',
          passengerPhone: incomingPassenger.phone || incomingRide.passengerPhone || '+54 9 294 400-1122',
          originText: incomingRide.originAddress || incomingRide.originText || 'Punto de partida',
          destText: incomingRide.destinationAddress || incomingRide.destText || 'Destino',
          originCoord: {
            lat: Number(incomingRide.originLat || incomingRide.originCoord?.lat || -41.1335),
            lng: Number(incomingRide.originLng || incomingRide.originCoord?.lng || -71.3103)
          },
          destCoord: {
            lat: Number(incomingRide.destinationLat || incomingRide.destCoord?.lat || -41.1415),
            lng: Number(incomingRide.destinationLng || incomingRide.destCoord?.lng || -71.3132)
          },
          fare: incomingRide.fare || incomingRide.estimatedFare || 3500,
          distanceKm: incomingRide.estimatedDistanceKm || incomingRide.distanceKm || 3.0,
          durationMins: incomingRide.estimatedDurationMins || incomingRide.durationMins || 8,
          paymentMethod: incomingRide.paymentMethod || 'cash',
          ring: data.ring || '3 km'
        };

        setIncomingOffer(offer);
        setCountdownSeconds(25);
        soundService.startIncomingRideRingtone();
        voiceService.speakNewOffer(offer.originText, offer.destText, offer.fare);
      };

      const handleRideRemoved = (data) => {
        if (incomingOffer && incomingOffer.id === data.rideId) {
          soundService.stopIncomingRideRingtone();
          setIncomingOffer(null);
        }
      };

      const handleCancelled = (data) => {
        if (incomingOffer && incomingOffer.id === data.rideId) {
          soundService.stopIncomingRideRingtone();
          setIncomingOffer(null);
        }
        if (activeRide && activeRide.id === data.rideId) {
          setActiveRide(null);
          soundService.stopIncomingRideRingtone();
          voiceService.speakPassengerCancelled();
        }
      };

      socket.on('ride:new_available', handleNewAvailable);
      socket.on('ride:removed', handleRideRemoved);
      socket.on('ride:cancelled', handleCancelled);

      // Local Tab Sync
      const unsubscribe = syncService.subscribe((msg) => {
        if (msg.type === 'RIDE_REQUESTED') {
          handleNewAvailable({ ride: msg.payload, passenger: { fullName: msg.payload.passengerName } });
        } else if (msg.type === 'RIDE_CANCELLED') {
          handleCancelled(msg.payload);
        }
      });

      return () => {
        socket.off('ride:new_available', handleNewAvailable);
        socket.off('ride:removed', handleRideRemoved);
        socket.off('ride:cancelled', handleCancelled);
        unsubscribe();
      };
    }
  }, [isOnline, hasPass24h, activeRide, incomingOffer, driverLoc]);

  // Temporizador de oferta entrante
  useEffect(() => {
    let timer = null;
    if (incomingOffer) {
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            handleRejectRide();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [incomingOffer]);

  // Cargar y sincronizar perfil del chofer en tiempo real con Admin
  useEffect(() => {
    apiService.getDriverProfile('usr-chofer-1').then(prof => {
      if (prof) {
        setDriverProfile(prev => ({
          ...prev,
          id: prof.id || prev.id,
          name: prof.fullName || prof.name || prev.name,
          phone: prof.phone || prev.phone,
          vehicleModel: prof.vehicleModel || prev.vehicleModel,
          vehicleColor: prof.vehicleColor || prev.vehicleColor,
          vehiclePlate: prof.vehiclePlate || prev.vehiclePlate,
          rating: prof.rating || prev.rating
        }));
      }
    });

    const unsubscribe = syncService.subscribe((msg) => {
      if (msg.type === 'DRIVER_PROFILE_UPDATED') {
        const prof = msg.payload;
        setDriverProfile(prev => ({
          ...prev,
          name: prof.fullName || prof.name || prev.name,
          phone: prof.phone || prev.phone,
          vehicleModel: prof.vehicleModel || `${prof.vehicleMake || ''} ${prof.vehicleName || ''}`.trim() || prev.vehicleModel,
          vehicleColor: prof.vehicleColor || prev.vehicleColor,
          vehiclePlate: prof.vehiclePlate || prev.vehiclePlate,
          rating: prof.rating || prev.rating
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Aceptar viaje
  const handleAcceptRide = () => {
    if (!incomingOffer) return;
    soundService.stopIncomingRideRingtone();
    soundService.playSuccessSound();

    // Desbloquear audio del navegador inmediatamente en el click/tap del chofer
    voiceService.unlockAudio();

    const pLat = Number(incomingOffer.originCoord?.lat || incomingOffer.originLat || -41.1335);
    const pLng = Number(incomingOffer.originCoord?.lng || incomingOffer.originLng || -71.3103);
    const dLat = Number(incomingOffer.destCoord?.lat || incomingOffer.destinationLat || -41.1415);
    const dLng = Number(incomingOffer.destCoord?.lng || incomingOffer.destinationLng || -71.3132);

    const acceptedRide = {
      ...incomingOffer,
      originCoord: { lat: pLat, lng: pLng },
      destCoord: { lat: dLat, lng: dLng },
      originText: incomingOffer.originText || 'Punto de partida',
      destText: incomingOffer.destText || 'Destino',
      status: 'accepted',
      driver: {
        ...driverProfile,
        lat: driverLoc.lat,
        lng: driverLoc.lng
      }
    };

    setActiveRide(acceptedRide);
    setIncomingOffer(null);
    setNavPhase('to_pickup');
    if (onRideChange) onRideChange(acceptedRide);
    syncService.emit('RIDE_ACCEPTED', acceptedRide);

    // Locución DENTRO del toque del chofer (habilita la voz en el celular)
    voiceService.speak('Viaje aceptado.');

    // Notificar al socket del backend
    const socket = apiService.getSocket();
    if (socket) {
      socket.emit('ride:accept', { 
        rideId: acceptedRide.id, 
        driverId: driverProfile.id,
        driver: {
          id: driverProfile.id,
          name: driverProfile.name,
          fullName: driverProfile.name,
          vehicle: `${driverProfile.vehicleModel} (${driverProfile.vehicleColor})`,
          plate: driverProfile.vehiclePlate,
          phone: driverProfile.phone,
          rating: driverProfile.rating,
          lat: driverLoc.lat,
          lng: driverLoc.lng
        }
      });
    }
  };

  // Rechazar viaje
  const handleRejectRide = () => {
    soundService.stopIncomingRideRingtone();
    soundService.playTapSound();
    setIncomingOffer(null);
  };

  // Notificar llegada al punto de encuentro
  const handleDriverArrived = () => {
    soundService.playTapSound();
    const updated = { ...activeRide, status: 'arriving' };
    setActiveRide(updated);
    setNavPhase('at_pickup');
    if (onRideChange) onRideChange(updated);
    syncService.emit('RIDE_ADVANCED', updated);

    const socket = apiService.getSocket();
    if (socket) {
      socket.emit('ride:update_status', { rideId: activeRide.id, status: 'arriving' });
    }

    voiceService.speak("Llegaste al punto de encuentro. Se notificó al pasajero.");
  };

  // Iniciar viaje con el pasajero
  const handleStartTrip = () => {
    soundService.playTapSound();
    const updated = { ...activeRide, status: 'in_progress' };
    setActiveRide(updated);
    setNavPhase('to_dest');
    if (onRideChange) onRideChange(updated);
    syncService.emit('RIDE_ADVANCED', updated);

    const socket = apiService.getSocket();
    if (socket) {
      socket.emit('ride:update_status', { rideId: activeRide.id, status: 'in_progress' });
    }

    voiceService.speak(`Viaje iniciado hacia ${cleanText(activeRide.destText)}. Conducí con precaución.`);
  };

  // Finalizar viaje y cobrar
  const handleCompleteTrip = () => {
    soundService.playSuccessSound();
    const fare = activeRide.fare;
    const updated = { ...activeRide, status: 'completed' };

    setTodayEarnings((prev) => prev + fare);
    setTodayTripsCount((prev) => prev + 1);

    setActiveRide(null);
    setNavPhase('completed');
    if (onRideChange) onRideChange(updated);
    syncService.emit('RIDE_ADVANCED', updated);

    const socket = apiService.getSocket();
    if (socket) {
      socket.emit('ride:update_status', { rideId: activeRide.id, status: 'completed' });
    }

    voiceService.speak(`Viaje finalizado. Cobrar ${fare} pesos al pasajero.`);
  };

  // Comprar Pase 24hs
  const handleBuyPass = () => {
    soundService.playSuccessSound();
    setHasPass24h(true);
    setPassHoursLeft(24);
    setPassModalOpen(false);
    voiceService.speak("Pase de 24 horas activado. Ya estás habilitado para recibir viajes en Bariloche.");
  };

  // 1. HUD Superior de Navegación Giro a Giro
  const renderNavHud = () => (
    <div className="driver-nav-hud animate-slide-down">
      <div className="nav-hud-left">
        <div className="turn-icon-box">
          <Navigation size={26} color="#00e5ff" />
        </div>
        <div className="turn-instructions">
          <div className="instruction-step">
            {navPhase === 'to_pickup' && `Yendo a buscar a ${activeRide.passengerName}`}
            {navPhase === 'at_pickup' && 'En punto de encuentro con el pasajero'}
            {navPhase === 'to_dest' && `En camino hacia ${cleanText(activeRide.destText)}`}
          </div>
          <div className="instruction-target">
            {navPhase === 'to_pickup' ? `Punto de recogida: ${cleanText(activeRide.originText)}` : `Destino final: ${cleanText(activeRide.destText)}`}
          </div>
        </div>
      </div>

      <div className="nav-hud-right">
        <div className="hud-eta">
          <span className="eta-mins">{navEta.mins || '3'} min</span>
          <span className="eta-km">{navEta.km || activeRide.distanceKm} km</span>
        </div>
      </div>
    </div>
  );

  // 2. Cockpit del Conductor (Perfil, Pase 24h, Switch Conexión)
  const renderDriverCockpit = () => (
    <div className="driver-top-cockpit">
      {/* Ficha Conductor */}
      <div className="driver-profile-pill">
        <div className="driver-avatar-badge">
          <Car size={16} color="#002230" />
        </div>
        <div className="driver-info-meta">
          <span className="driver-name">{driverProfile.name}</span>
          <span className="driver-car">{driverProfile.vehicleModel} • {driverProfile.vehiclePlate}</span>
        </div>
        <div className="driver-rating-pill">
          ⭐ {driverProfile.rating}
        </div>
      </div>

      {/* Banner Pase 24 Horas */}
      <div 
        className={`pass-status-pill ${hasPass24h ? 'active' : 'expired'}`}
        onClick={() => !hasPass24h && setPassModalOpen(true)}
      >
        <Award size={15} color={hasPass24h ? '#fbbf24' : '#ef4444'} />
        <div className="pass-text">
          <strong>{hasPass24h ? 'Pase 24h Activo' : 'Sin Pase 24h'}</strong>
          <span>{hasPass24h ? `Quedan ${passHoursLeft}hs • 0% comisión` : 'Comprar Pase $4.500'}</span>
        </div>
      </div>

      {/* Master Switch Conexión */}
      <div className="online-toggle-card">
        <div className="toggle-info">
          <span className={`status-dot-pulse ${isOnline ? 'online' : 'offline'}`}></span>
          <span className="status-label">
            {isOnline ? 'EN LÍNEA • RECIBIENDO VIAJES' : 'DESCONECTADO'}
          </span>
          {driverLoc.isRealGps && (
            <span className="gps-live-tag">
              <Radio size={10} color="#10b981" /> GPS Real
            </span>
          )}
        </div>
        <button 
          className={`master-switch-btn ${isOnline ? 'online' : 'offline'}`}
          onClick={() => {
            soundService.playTapSound();
            if (!hasPass24h && !isOnline) {
              setPassModalOpen(true);
              return;
            }
            setIsOnline(!isOnline);
          }}
        >
          <Power size={16} />
          <span>{isOnline ? 'Desconectar' : 'Conectar'}</span>
        </button>
      </div>
    </div>
  );

  // 3. Telemetría de Ganancias y Rendimiento
  const renderEarningsTelemetry = () => (
    <div className="driver-bottom-telemetry">
      <div className="telemetry-card">
        <div className="telemetry-item">
          <span className="telemetry-label">Recaudación Hoy</span>
          <span className="telemetry-value text-emerald">${todayEarnings.toLocaleString('es-AR')}</span>
        </div>
        <div className="telemetry-divider"></div>
        <div className="telemetry-item">
          <span className="telemetry-label">Viajes Realizados</span>
          <span className="telemetry-value">{todayTripsCount} viajes</span>
        </div>
        <div className="telemetry-divider"></div>
        <div className="telemetry-item">
          <span className="telemetry-label">Velocidad GPS</span>
          <span className="telemetry-value text-cyan">{driverLoc.speed} km/h</span>
        </div>
      </div>
    </div>
  );

  // 4. Barra de Viaje Activo
  const renderActiveTripBar = () => (
    <div className="driver-active-trip-bottom-bar animate-slide-up">
      <div className="active-trip-passenger-bar">
        <div className="passenger-compact-info">
          <div className="compact-avatar">OS</div>
          <div className="compact-names">
            <strong>{activeRide.passengerName}</strong>
            <span>PIN: {activeRide.pin || '8419'}</span>
          </div>
        </div>

        <div className="compact-contacts">
          <a href="tel:+5492944001122" className="quick-icon-btn">
            <Phone size={16} />
          </a>
          <a href="https://wa.me/5492944001122" target="_blank" rel="noreferrer" className="quick-icon-btn whatsapp">
            <MessageSquare size={16} />
          </a>
        </div>

        <div className="compact-fare">
          <span className="cf-sub">Tarifa</span>
          <strong className="cf-val">${activeRide.fare}</strong>
        </div>
      </div>

      <div className="active-trip-action-slot">
        {navPhase === 'to_pickup' && (
          <button className="trip-phase-btn phase-arrived" onClick={handleDriverArrived}>
            <CheckCircle2 size={18} />
            <span>Llegué al Punto de Encuentro (Notificar)</span>
          </button>
        )}

        {navPhase === 'at_pickup' && (
          <button className="trip-phase-btn phase-start" onClick={handleStartTrip}>
            <Navigation size={18} />
            <span>Iniciar Viaje con Pasajero</span>
          </button>
        )}

        {navPhase === 'to_dest' && (
          <button className="trip-phase-btn phase-complete" onClick={handleCompleteTrip}>
            <CheckCircle2 size={18} />
            <span>Finalizar Viaje y Cobrar ${activeRide.fare}</span>
          </button>
        )}
      </div>
    </div>
  );

  // 5. Alerta de Viaje Entrante con Cuenta Regresiva
  const renderIncomingRideAlert = () => (
    <div className="incoming-ride-overlay animate-scale-up">
      <div className="incoming-ride-card">
        <div className="incoming-header">
          <div className="radar-ping-icon">
            <Car size={26} color="#10b981" />
          </div>
          <div className="alert-titles">
            <span className="badge-new-ride">¡NUEVO VIAJE ENTRANTE!</span>
            <span className="bariloche-tag">San Carlos de Bariloche</span>
          </div>
          <div className="countdown-circle">
            <span>{countdownSeconds}s</span>
          </div>
        </div>

        <div className="incoming-fare-box">
          <span className="fare-net-label">GANANCIA NETA DEL VIAJE (0% COMISIÓN)</span>
          <span className="fare-big-amount">${incomingOffer.fare}</span>
          <span className="payment-hint">
            Pago en {incomingOffer.paymentMethod === 'cash' ? 'Efectivo' : 'Mercado Pago'}
          </span>
        </div>

        <div className="incoming-trip-details">
          <div className="detail-passenger-row">
            <div className="pas-avatar">OS</div>
            <div className="pas-meta">
              <strong>{incomingOffer.passengerName}</strong>
              <span>⭐ 4.98 • Pasajero Verificado</span>
            </div>
            <div className="distance-chip">
              A {incomingOffer.distanceKm} km (4 min)
            </div>
          </div>

          <div className="route-preview-box">
            <div className="preview-point">
              <div className="p-dot origin"></div>
              <div className="p-text">
                <span className="p-type">Recoger en:</span>
                <strong>{incomingOffer.originText}</strong>
              </div>
            </div>
            <div className="preview-point">
              <div className="p-dot dest"></div>
              <div className="p-text">
                <span className="p-type">Destino:</span>
                <strong>{incomingOffer.destText}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="incoming-actions-row">
          <button className="reject-ride-btn" onClick={handleRejectRide}>
            Rechazar
          </button>
          <button className="accept-ride-btn" onClick={handleAcceptRide}>
            <CheckCircle2 size={20} />
            <span>Aceptar Viaje (${incomingOffer.fare})</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 6. Modal de Compra de Pase 24hs
  const renderPassModal = () => (
    <div className="modal-backdrop">
      <div className="pass-purchase-modal animate-scale-up">
        <button className="modal-close-icon" onClick={() => setPassModalOpen(false)}>
          <X size={18} />
        </button>
        <div className="pass-modal-icon">
          <Award size={36} color="#fbbf24" />
        </div>
        <h3>Pase Diario de 24 Horas</h3>
        <p>Conéctate y realiza viajes ilimitados durante 24 horas continuas con 0% de comisión sobre tus ingresos en Bariloche.</p>

        <div className="pass-features-list">
          <div className="p-feat">
            <CheckCircle2 size={16} color="#10b981" />
            <span>100% de la recaudación para vos</span>
          </div>
          <div className="p-feat">
            <CheckCircle2 size={16} color="#10b981" />
            <span>Cobro directo a pasajeros por Mercado Pago o Efectivo</span>
          </div>
          <div className="p-feat">
            <CheckCircle2 size={16} color="#10b981" />
            <span>Habilitación instantánea para operar en Bariloche</span>
          </div>
        </div>

        <div className="pass-price-banner">
          <span className="p-price-label">Precio del Pase 24hs:</span>
          <span className="p-price-val">$4.500 ARS</span>
        </div>

        <button className="confirm-buy-pass-btn" onClick={handleBuyPass}>
          Activar Pase de 24 Horas Ahora
        </button>
      </div>
    </div>
  );

  const isPhoneMode = viewMode === 'phone';

  return (
    <div className={`driver-app-container ${isPhoneMode ? 'mode-phone' : 'mode-desktop'}`}>
      {activeRide ? (
        /* VISTA GPS COMPLETA CUANDO EL CONDUCTOR TOMA UN VIAJE */
        <DriverGpsView
          activeRide={activeRide}
          driverLoc={driverLoc}
          driverProfile={driverProfile}
          navPhase={navPhase}
          onDriverArrived={handleDriverArrived}
          onStartTrip={handleStartTrip}
          onCompleteTrip={handleCompleteTrip}
          viewMode={viewMode}
        />
      ) : isPhoneMode ? (
        /* VISTA DISPOSITIVO MÓVIL DISPONIBLE (RADAR / COCKPIT) */
        <>
          <div className="phone-map-pane">
            <BarigoMap 
              pickup={null}
              dropoff={null}
              drivers={[]}
              assignedDriver={null}
              center={{ lat: driverLoc.lat, lng: driverLoc.lng }}
              zoom={15}
              className="driver-map-element"
            />
          </div>

          <div className="phone-sheet-pane">
            <div className="sheet-drag-pill"></div>
            {renderDriverCockpit()}
            {renderEarningsTelemetry()}
          </div>
        </>
      ) : (
        /* VISTA ESCRITORIO: DASHBOARD 2 COLUMNAS (SIDEBAR + MAPA COMPLETO) */
        <>
          <div className="desktop-sidebar-pane">
            <div className="desktop-sidebar-scroll">
              {renderDriverCockpit()}
              {renderEarningsTelemetry()}
            </div>
          </div>

          <div className="desktop-map-pane">
            <BarigoMap 
              pickup={null}
              dropoff={null}
              drivers={[]}
              assignedDriver={null}
              center={{ lat: driverLoc.lat, lng: driverLoc.lng }}
              zoom={15}
              className="driver-map-element"
            />
            <div className="desktop-map-badge">
              <span className="live-dot"></span>
              <span>Radar Conductor BariGo • San Carlos de Bariloche</span>
            </div>
          </div>
        </>
      )}

      {/* Overlays y Modales */}
      {incomingOffer && renderIncomingRideAlert()}
      {passModalOpen && renderPassModal()}
    </div>
  );
}
