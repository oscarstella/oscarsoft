import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Car, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Banknote, 
  Phone, 
  MessageSquare, 
  X, 
  ChevronRight, 
  Star, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Crosshair,
  ArrowRight,
  Radio,
  History,
  RotateCcw
} from 'lucide-react';
import BarigoMap from '../BarigoMap';
import { 
  BARILOCHE_PRESETS, 
  BARILOCHE_STREET_DIRECTORY, 
  VEHICLE_CATEGORIES, 
  DEFAULT_FARE_SETTINGS,
  INITIAL_DRIVERS,
  BARILOCHE_CENTER
} from '../../constants/barilocheData';
import { soundService } from '../../services/soundService';
import { voiceService } from '../../services/voiceService';
import { syncService } from '../../services/syncService';
import { gpsService } from '../../services/gpsService';
import { apiService } from '../../services/apiService';
import { getStreetRoute, searchBarilocheAddress } from '../../services/routingService';
import { getBarilocheWeather } from '../../services/weatherService';

export default function PassengerApp({ externalRide, onRideChange, viewMode = 'phone' }) {
  // Pasos: 1 = Origen, 2 = Destino, 3 = Categoría Auto, 4 = Pago y Confirmar
  const [currentStep, setCurrentStep] = useState(1);
  const [originText, setOriginText] = useState('Centro Cívico de Bariloche');
  const [originCoord, setOriginCoord] = useState(BARILOCHE_CENTER);
  const [destText, setDestText] = useState('');
  const [destCoord, setDestCoord] = useState(null);
  
  // Ruteo calle por calle (OSRM)
  const [routePolyline, setRoutePolyline] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [estimatedMins, setEstimatedMins] = useState(0);

  // GPS
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isRealGpsActive, setIsRealGpsActive] = useState(false);

  // Autocompletado inteligente
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // 'origin' | 'dest' | null
  const [selectedCategory, setSelectedCategory] = useState(VEHICLE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'transfer'
  
  // Estado del Viaje
  const [rideState, setRideState] = useState(externalRide || null);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [tip, setTip] = useState(0);

  // Alerta automática cuando el chofer está a 1 minuto
  const [oneMinuteAlert, setOneMinuteAlert] = useState(null);
  const [driverAutoMessage, setDriverAutoMessage] = useState(null);

  // Historial de Viajes ("Mis Viajes")
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState(null);

  useEffect(() => {
    getBarilocheWeather().then(w => {
      if (w) setWeatherInfo(w);
    });
  }, []);

  // Choferes en vivo desde Backend Socket
  const [liveDrivers, setLiveDrivers] = useState(INITIAL_DRIVERS);

  // 1. Cargar Historial de Viajes guardado localmente
  useEffect(() => {
    try {
      const saved = localStorage.getItem('barigo_passenger_trip_history');
      if (saved) {
        setTripHistory(JSON.parse(saved));
      } else {
        setTripHistory([]);
      }
    } catch (e) {
      console.warn('Error reading trip history:', e);
    }
  }, []);

  // 2. Cálculo de Ruta Calle por Calle (OSRM) en tiempo real
  useEffect(() => {
    if (!originCoord || !destCoord) return;
    let isCancelled = false;

    getStreetRoute(originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng)
      .then(res => {
        if (!isCancelled && res) {
          if (res.points && res.points.length > 0) {
            setRoutePolyline(res.points);
          }
          if (res.distanceKm) setDistanceKm(res.distanceKm);
          if (res.durationMin) setEstimatedMins(res.durationMin);
        }
      })
      .catch(err => {
        console.warn('[Ruteo] Error trazando calle por calle:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [originCoord?.lat, originCoord?.lng, destCoord?.lat, destCoord?.lng]);

  // 3. Geolocalización GPS Real al montar
  useEffect(() => {
    handleLocateGps(true);

    const socket = apiService.getSocket();
    if (socket) {
      socket.on('drivers:radar_update', (data) => {
        setLiveDrivers(prev => {
          const index = prev.findIndex(d => d.id === data.driverId);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], lat: data.lat, lng: data.lng };
            return updated;
          }
          return prev;
        });
      });
    }

    return () => {};
  }, []);

  const handleLocateGps = async (initial = false) => {
    setIsLocatingGps(true);
    try {
      const pos = await gpsService.getCurrentPosition();
      setOriginCoord({ lat: pos.lat, lng: pos.lng });
      setGpsAccuracy(pos.accuracy ? Math.round(pos.accuracy) : null);
      setIsRealGpsActive(pos.isRealGps);

      const addressName = await gpsService.reverseGeocode(pos.lat, pos.lng);
      if (addressName) {
        setOriginText(addressName);
      } else if (!originText) {
        setOriginText('Centro Cívico de Bariloche');
      }

      if (!initial) {
        soundService.playSuccessSound();
      }
    } catch (e) {
      console.warn('Error GPS:', e);
      if (!originText) {
        setOriginText('Centro Cívico de Bariloche');
      }
    } finally {
      setIsLocatingGps(false);
    }
  };

  // 4. Sincronización en tiempo real (Sockets y BroadcastChannel)
  useEffect(() => {
    const socket = apiService.getSocket();
    const handleAccepted = (data) => {
      console.log('[Web Pasajero] ¡Viaje aceptado por chofer!', data);
      const incomingRide = data.ride || data || {};
      const incomingDriver = data.driver || incomingRide.driver || {};
      const pLat = Number(incomingRide.originCoord?.lat || incomingRide.originLat || -41.1335);
      const pLng = Number(incomingRide.originCoord?.lng || incomingRide.originLng || -71.3103);
      const dLat = Number(incomingRide.destCoord?.lat || incomingRide.destinationLat || -41.1415);
      const dLng = Number(incomingRide.destCoord?.lng || incomingRide.destinationLng || -71.3132);
      const drvLat = Number.isFinite(Number(incomingDriver.lat)) ? Number(incomingDriver.lat) : (pLat + 0.002);
      const drvLng = Number.isFinite(Number(incomingDriver.lng)) ? Number(incomingDriver.lng) : (pLng - 0.002);

      const acceptedRide = {
        ...incomingRide,
        status: incomingRide.status || 'accepted',
        originCoord: { lat: pLat, lng: pLng },
        destCoord: { lat: dLat, lng: dLng },
        originText: incomingRide.originText || incomingRide.originAddress || originText || 'Punto de partida',
        destText: incomingRide.destText || incomingRide.destinationAddress || destText || 'Destino',
        fare: incomingRide.fare || incomingRide.estimatedFare || 3500,
        driver: {
          id: incomingDriver.id || 'usr-chofer-1',
          name: incomingDriver.fullName || incomingDriver.name || 'Carlos Nahuel Huapi',
          vehicleModel: incomingDriver.vehicle || `${incomingDriver.vehicleModel || 'Chevrolet Onix'} (${incomingDriver.vehicleColor || 'Blanco'})`,
          vehicleColor: incomingDriver.vehicleColor || 'Blanco',
          vehiclePlate: incomingDriver.plate || incomingDriver.vehiclePlate || 'AF 342 BZ',
          phone: incomingDriver.phone || '+54 9 294 422-3344',
          rating: incomingDriver.rating || 4.96,
          lat: drvLat,
          lng: drvLng
        }
      };

      setOriginCoord({ lat: pLat, lng: pLng });
      setDestCoord({ lat: dLat, lng: dLng });
      setRideState(acceptedRide);
      if (onRideChange) onRideChange(acceptedRide);
      soundService.playSuccessSound();
      voiceService.speakDriverAssigned(
        acceptedRide.driver.name,
        acceptedRide.driver.vehicleModel,
        3
      );
    };

    const handleStatusChanged = (data) => {
      setRideState(prev => {
        if (!prev) return null;
        const updated = { ...prev, status: data.status, ...(data.ride || {}) };
        if (onRideChange) onRideChange(updated);
        return updated;
      });

      if (data.status === 'arriving') {
        soundService.playChimeTone();
        voiceService.speakDriverArrived('Tu chofer');
      } else if (data.status === 'in_progress') {
        voiceService.speakTripStarted(destText);
      } else if (data.status === 'completed') {
        soundService.playSuccessSound();
        voiceService.speakTripCompleted(data.ride?.fare || data.ride?.estimatedFare || 3500);
        setCompletedModalOpen(true);
      }
    };

    const handleCancelled = () => {
      setRideState(null);
      setOneMinuteAlert(null);
      setDriverAutoMessage(null);
      if (onRideChange) onRideChange(null);
    };

    const handleOneMinuteAlert = (data) => {
      console.log('[Web Pasajero] ¡Alerta automática de 1 minuto recibida!', data);
      setOneMinuteAlert(data);
      setDriverAutoMessage(data?.message || '¡Hola! Estoy a 1 minuto de llegar a tu ubicación. Por favor salí al punto de encuentro.');
      soundService.playChimeTone();
      voiceService.speakOneMinuteAlert();
    };

    if (socket) {
      socket.on('ride:accepted', handleAccepted);
      socket.on('ride:status_changed', handleStatusChanged);
      socket.on('ride:cancelled', handleCancelled);
      socket.on('ride:one_minute_alert', handleOneMinuteAlert);
    }

    const unsubscribe = syncService.subscribe((msg) => {
      if (msg.type === 'RIDE_ACCEPTED' || msg.type === 'RIDE_ADVANCED' || msg.type === 'RIDE_UPDATED') {
        handleAccepted(msg.payload);
      } else if (msg.type === 'RIDE_CANCELLED') {
        setRideState(null);
        setOneMinuteAlert(null);
        setDriverAutoMessage(null);
        if (onRideChange) onRideChange(null);
      } else if (msg.type === 'DRIVER_1MIN_ALERT') {
        handleOneMinuteAlert(msg.payload);
      }
    });

    return () => {
      if (socket) {
        socket.off('ride:accepted', handleAccepted);
        socket.off('ride:status_changed', handleStatusChanged);
        socket.off('ride:cancelled', handleCancelled);
        socket.off('ride:one_minute_alert', handleOneMinuteAlert);
      }
      unsubscribe();
    };
  }, [onRideChange, destText]);

  useEffect(() => {
    if (externalRide !== undefined) {
      setRideState(externalRide);
    }
  }, [externalRide]);

  // Cálculo de tarifa basado en distancia real de calle
  const calculateFare = (category) => {
    const cat = category || selectedCategory || VEHICLE_CATEGORIES[0];
    if (!distanceKm || distanceKm <= 0) {
      return DEFAULT_FARE_SETTINGS.minRideFare;
    }
    const raw = (DEFAULT_FARE_SETTINGS.baseFare + 
                (distanceKm * DEFAULT_FARE_SETTINGS.perKmRate) + 
                (estimatedMins * DEFAULT_FARE_SETTINGS.perMinuteRate)) * (cat.multiplier || 1.0);
    const total = Math.max(raw, DEFAULT_FARE_SETTINGS.minRideFare);
    return Math.round(total / 50) * 50;
  };

  // Manejador de autocompletado inteligente con POIs y Calle + Número
  const handleSearchInput = async (text, type) => {
    if (type === 'origin') setOriginText(text);
    else setDestText(text);

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await searchBarilocheAddress(text);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  };

  const handleInputKeyDown = async (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        selectSuggestion(suggestions[0], type);
      } else {
        const text = type === 'origin' ? originText : destText;
        if (text.trim().length >= 2) {
          const res = await searchBarilocheAddress(text.trim());
          if (res.length > 0) {
            selectSuggestion(res[0], type);
          }
        }
      }
    }
  };

  const selectSuggestion = (sug, type) => {
    soundService.playTapSound();
    if (type === 'origin') {
      setOriginText(sug.title);
      setOriginCoord({ lat: sug.lat, lng: sug.lng });
    } else {
      setDestText(sug.title);
      setDestCoord({ lat: sug.lat, lng: sug.lng });
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  // Solicitar viaje al estilo Uber
  const handleRequestRide = async () => {
    if (!originText.trim() || !destText.trim()) {
      soundService.playTapSound();
      alert('Por favor ingresá un origen y un destino antes de solicitar el viaje.');
      return;
    }
    voiceService.unlockAudio();
    soundService.playTapSound();
    const fare = calculateFare(selectedCategory);
    const resolvedOrigin = originCoord || BARILOCHE_CENTER;
    const resolvedDest = destCoord || BARILOCHE_PRESETS[4].location;
    
    const newRide = {
      id: 'ride-' + Date.now().toString().slice(-4),
      passengerName: 'Oscar Stella',
      passengerPhone: '+54 9 294 400-1122',
      passengerRating: 4.98,
      originText,
      originCoord: resolvedOrigin,
      destText,
      destCoord: resolvedDest,
      distanceKm,
      estimatedMins,
      fare,
      category: selectedCategory,
      paymentMethod,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'searching',
      driver: null,
      createdAt: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    setRideState(newRide);
    if (onRideChange) onRideChange(newRide);

    syncService.emit('RIDE_REQUESTED', newRide);
    apiService.requestRide(newRide);
    const socket = apiService.getSocket();
    if (socket) {
      socket.emit('ride:request', {
        ...newRide,
        originAddress: originText,
        originLat: resolvedOrigin.lat,
        originLng: resolvedOrigin.lng,
        destinationAddress: destText,
        destinationLat: resolvedDest.lat,
        destinationLng: resolvedDest.lng,
        fare,
        estimatedFare: fare
      });
    }
    voiceService.speakSearching();
  };

  const handleCancelRide = () => {
    soundService.playTapSound();
    syncService.emit('RIDE_CANCELLED', { id: rideState?.id });
    const socket = apiService.getSocket();
    if (socket && rideState?.id) {
      socket.emit('ride:cancel', { rideId: rideState.id });
    }
    setRideState(null);
    if (onRideChange) onRideChange(null);
    voiceService.speak("Viaje cancelado.");
  };

  const toggleVoice = () => {
    const newState = voiceService.toggle();
    setVoiceMuted(!newState);
  };

  const handleMapClick = async (point) => {
    if (!rideState) {
      if (activeInput === 'origin') {
        setOriginCoord(point);
        const addr = await gpsService.reverseGeocode(point.lat, point.lng);
        setOriginText(addr);
        setActiveInput(null);
      } else if (activeInput === 'dest') {
        setDestCoord(point);
        const addr = await gpsService.reverseGeocode(point.lat, point.lng);
        setDestText(addr);
        setActiveInput(null);
      }
    }
  };

  // Guardar viaje completado en historial
  const handleFinishCompletedRide = () => {
    soundService.playTapSound();
    if (rideState) {
      const completedTrip = {
        id: rideState.id || ('viaje-' + Date.now().toString().slice(-4)),
        date: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        originText: rideState.originText,
        destText: rideState.destText,
        originCoord: rideState.originCoord,
        destCoord: rideState.destCoord,
        fare: (rideState.fare || calculateFare(selectedCategory)) + tip,
        status: 'Completado',
        driverName: rideState.driver?.name || 'Carlos Nahuel Huapi',
        vehicle: `${rideState.driver?.vehicleModel || 'Chevrolet Onix'} • ${rideState.driver?.vehiclePlate || 'AF 342 BZ'}`,
        paymentMethod: paymentMethod === 'cash' ? 'Efectivo' : 'Mercado Pago',
        rating: rating
      };

      setTripHistory(prev => {
        const updated = [completedTrip, ...prev];
        try {
          localStorage.setItem('barigo_passenger_trip_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    setCompletedModalOpen(false);
    setRideState(null);
    setTip(0);
    setRating(5);
    if (onRideChange) onRideChange(null);
  };

  // Repetir un viaje del historial
  const handleRepeatHistoryTrip = (trip) => {
    soundService.playTapSound();
    setOriginText(trip.originText);
    if (trip.originCoord) setOriginCoord(trip.originCoord);
    setDestText(trip.destText);
    if (trip.destCoord) setDestCoord(trip.destCoord);
    setHistoryModalOpen(false);
    setCurrentStep(3);
  };

  // 1. Radar animado buscando chofer
  const renderSearchingRadar = () => (
    <div className="drawer-panel searching-panel animate-fade-in">
      <div className="radar-animation-box">
        <div className="radar-circle circle-1"></div>
        <div className="radar-circle circle-2"></div>
        <div className="radar-circle circle-3"></div>
        <div className="radar-center-icon">
          <Car size={24} color="#00e5ff" />
        </div>
      </div>
      <h3 className="searching-title">Buscando choferes en Bariloche...</h3>
      <p className="searching-subtitle">
        Conectando por WebSockets con conductores verificados cercanos en Bariloche.
      </p>
      <div className="searching-meta">
        <span className="meta-item">
          <ShieldCheck size={14} color="#10b981" /> 0% comisión a terceros
        </span>
        <span className="meta-item">
          <Clock size={14} color="#00e5ff" /> Tarifa: ${rideState.fare}
        </span>
      </div>
      <button className="cancel-ride-btn" onClick={handleCancelRide}>
        Cancelar Solicitud
      </button>
    </div>
  );

  // 2. Ficha completa del viaje aceptado / en camino
  const renderActiveRide = () => (
    <div className="drawer-panel active-ride-panel animate-fade-in">
      <div className="ride-status-header">
        <div className="status-badge-chip">
          {rideState.status === 'accepted' && 'Chofer en camino al punto de partida'}
          {rideState.status === 'arriving' && '¡Chofer llegando al punto de encuentro!'}
          {rideState.status === 'in_progress' && 'En viaje hacia el destino'}
        </div>
        <div className="eta-badge">
          <Clock size={14} />
          <span>{rideState.status === 'in_progress' ? `${rideState.estimatedMins} min` : '3 min'}</span>
        </div>
      </div>

      <div className="driver-profile-card">
        <div className="driver-photo-box">
          <div className="driver-avatar-circle">
            {rideState.driver?.name?.charAt(0) || 'C'}
          </div>
          <div className="rating-tag">
            <Star size={10} fill="#fbbf24" color="#fbbf24" />
            <span>{rideState.driver?.rating || 4.96}</span>
          </div>
        </div>

        <div className="driver-details">
          <h4 className="driver-fullname">{rideState.driver?.name || 'Carlos Nahuel Huapi'}</h4>
          <div className="vehicle-line">
            <span className="vehicle-name">{rideState.driver?.vehicleModel || 'Chevrolet Onix Joy'}</span>
            <span className="vehicle-color">• {rideState.driver?.vehicleColor || 'Blanco'}</span>
          </div>
          <div className="plate-badge">
            {rideState.driver?.vehiclePlate || 'AF 342 BZ'}
          </div>
        </div>

        <div className="security-pin-box">
          <span className="pin-title">PIN SEGURIDAD</span>
          <span className="pin-digits">{rideState.pin || '8419'}</span>
        </div>
      </div>

      {/* MENSAJE AUTOMÁTICO DEL CHOFER CUANDO ESTÁ A 1 MINUTO */}
      {driverAutoMessage && (
        <div className="driver-auto-msg-card animate-slide-down">
          <div className="msg-header">
            <span className="msg-badge">🚗 RESPUESTA AUTOMÁTICA DEL CHOFER</span>
            <span className="msg-time">Hace instantes</span>
          </div>
          <p className="msg-text">"{driverAutoMessage}"</p>
        </div>
      )}

      <div className="ride-route-summary">
        <div className="route-point">
          <div className="dot-origin"></div>
          <span>{rideState.originText}</span>
        </div>
        <div className="route-connector"></div>
        <div className="route-point">
          <div className="dot-dest"></div>
          <span>{rideState.destText}</span>
        </div>
      </div>

      <div className="driver-contact-actions">
        <a href={`tel:${rideState.driver?.phone || '+5492944223344'}`} className="contact-btn call">
          <Phone size={16} />
          <span>Llamar</span>
        </a>
        <a 
          href={`https://wa.me/5492944223344?text=Hola,%20estoy%20en%20el%20punto%20de%20encuentro%20de%20BariGo`} 
          target="_blank" 
          rel="noreferrer" 
          className="contact-btn chat"
        >
          <MessageSquare size={16} />
          <span>WhatsApp</span>
        </a>
        <div className="fare-badge">
          <span className="fare-sub">A pagar</span>
          <span className="fare-val">${rideState.fare}</span>
        </div>
      </div>

      <button className="cancel-subtle-btn" onClick={handleCancelRide}>
        Cancelar viaje
      </button>
    </div>
  );

  // 3. Formulario progresivo de reserva de viaje
  const renderBookingForm = () => (
    <div className="drawer-panel booking-panel animate-fade-in">
      <div className="step-indicator-bar">
        <div className={`step-dot ${currentStep >= 1 ? 'active' : ''}`}>1. Origen</div>
        <ChevronRight size={14} className="step-arrow" />
        <div className={`step-dot ${currentStep >= 2 ? 'active' : ''}`}>2. Destino</div>
        <ChevronRight size={14} className="step-arrow" />
        <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>3. Vehículo</div>
      </div>

      {/* INPUTS DE DIRECCIÓN */}
      <div className="destination-inputs-card">
        <div className="input-group-row">
          <div className="input-icon origin">
            <div className="ring-dot"></div>
          </div>
          <div className="input-field-wrapper">
            <div className="field-label-row">
              <label className="field-label">Punto de partida</label>
              {isRealGpsActive && (
                <span className="gps-live-tag">
                  <Radio size={10} color="#10b981" /> GPS Real ({gpsAccuracy}m)
                </span>
              )}
            </div>
            <input 
              type="text" 
              value={originText} 
              onChange={(e) => handleSearchInput(e.target.value, 'origin')}
              onKeyDown={(e) => handleInputKeyDown(e, 'origin')}
              onFocus={() => { setActiveInput('origin'); setCurrentStep(1); }}
              className="address-input"
              placeholder="¿Dónde te buscamos? (Ej: Mitre 540 o Hospital)"
            />
          </div>
          <button 
            className="gps-refresh-btn" 
            onClick={() => handleLocateGps(false)}
            title="Actualizar mi GPS"
          >
            <Crosshair size={15} color="#00e5ff" />
          </button>
        </div>

        <div className="inputs-divider"></div>

        <div className="input-group-row">
          <div className="input-icon dest">
            <MapPin size={16} color="#fbbf24" />
          </div>
          <div className="input-field-wrapper">
            <label className="field-label">Destino</label>
            <input 
              type="text" 
              value={destText} 
              onChange={(e) => handleSearchInput(e.target.value, 'dest')}
              onKeyDown={(e) => handleInputKeyDown(e, 'dest')}
              onFocus={() => { setActiveInput('dest'); setCurrentStep(2); }}
              className="address-input"
              placeholder="¿A dónde vas? (Ej: Pasaje Gutiérrez 980 o Hospital)"
            />
          </div>
          {destText && (
            <button className="clear-btn" onClick={() => setDestText('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE SUGERENCIAS EN VIVO (POIs + Calle y Número) */}
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown animate-fade-in">
          {suggestions.map((sug, idx) => (
            <div 
              key={sug.id || idx} 
              className="suggestion-item"
              onClick={() => selectSuggestion(sug, activeInput || 'dest')}
            >
              <div className="sug-icon">
                {sug.icon ? <span style={{ fontSize: '1.1rem' }}>{sug.icon}</span> : <MapPin size={16} />}
              </div>
              <div className="sug-content">
                <div className="sug-title-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="sug-title">{sug.title}</span>
                  {sug.tag && (
                    <span className="sug-badge-tag" style={{
                      fontSize: '0.65rem',
                      background: 'rgba(0, 229, 255, 0.12)',
                      color: '#00e5ff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(0, 229, 255, 0.25)'
                    }}>
                      {sug.tag}
                    </span>
                  )}
                </div>
                <div className="sug-subtitle">{sug.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PUNTOS RÁPIDOS POPULARES DE BARILOCHE */}
      {currentStep <= 2 && suggestions.length === 0 && (
        <div className="quick-presets-section">
          <span className="quick-label">Destinos frecuentes:</span>
          <div className="presets-scroll">
            {BARILOCHE_PRESETS.filter(p => p.popular).map((preset) => (
              <button 
                key={preset.id}
                className="preset-chip"
                onClick={() => {
                  soundService.playTapSound();
                  setDestText(preset.title);
                  setDestCoord(preset.location);
                  setCurrentStep(3);
                }}
              >
                <MapPin size={12} />
                <span>{preset.title.split(' (')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 3: SELECTOR DE CATEGORÍA DE AUTO */}
      <div className="vehicle-selection-section">
        <div className="section-title-row">
          <span className="sec-title">Vehículos disponibles:</span>
          <span className="sec-dist" style={{ color: '#00e5ff', fontWeight: 600 }}>
            {distanceKm} km • ~{estimatedMins} min (Calle por calle)
          </span>
        </div>

        <div className="vehicle-options-grid">
          {VEHICLE_CATEGORIES.map((cat) => {
            const fare = calculateFare(cat);
            const isSelected = selectedCategory.id === cat.id;

            return (
              <div 
                key={cat.id} 
                className={`vehicle-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  soundService.playTapSound();
                  setSelectedCategory(cat);
                  setCurrentStep(3);
                }}
              >
                <div className="vehicle-top">
                  <div className="vehicle-icon-box">
                    <Car size={26} color={isSelected ? '#00e5ff' : '#94a3b8'} />
                  </div>
                  <div className="vehicle-name-group">
                    <div className="v-name">
                      {cat.name}
                      {cat.badge && <span className="v-badge">{cat.badge}</span>}
                    </div>
                    <div className="v-desc">{cat.etaMins} min • 4 asientos</div>
                  </div>
                  <div className="vehicle-price-box">
                    <div className="v-price">${fare}</div>
                    <div className="v-guarantee">Tarifa fija</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PASO 4: FORMA DE PAGO Y BOTÓN DE CONFIRMACIÓN */}
      <div className="payment-and-confirm-bar">
        <div className="payment-method-toggle">
          <button 
            className={`pay-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => { soundService.playTapSound(); setPaymentMethod('cash'); }}
          >
            <Banknote size={15} />
            <span>Efectivo</span>
          </button>
          <button 
            className={`pay-btn ${paymentMethod === 'transfer' ? 'active' : ''}`}
            onClick={() => { soundService.playTapSound(); setPaymentMethod('transfer'); }}
          >
            <CreditCard size={15} />
            <span>Mercado Pago</span>
          </button>
        </div>

        <button className="confirm-ride-cta" onClick={handleRequestRide}>
          <span>Solicitar {selectedCategory.name}</span>
          <span className="cta-price">${calculateFare(selectedCategory)}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderRideOrBookingContent = () => {
    if (rideState?.status === 'searching') return renderSearchingRadar();
    if (rideState && (rideState.status === 'accepted' || rideState.status === 'arriving' || rideState.status === 'in_progress')) {
      return renderActiveRide();
    }
    return renderBookingForm();
  };

  // Modal de Historial de Viajes ("Mis Viajes")
  const renderHistoryModal = () => (
    <div className="modal-backdrop" onClick={() => setHistoryModalOpen(false)}>
      <div 
        className="completed-trip-card animate-scale-up" 
        style={{ maxWidth: '440px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="#00e5ff" /> Mis Viajes
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Historial de traslados en Bariloche
            </p>
          </div>
          <button 
            onClick={() => setHistoryModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {tripHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
              <Clock size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p>No tienes viajes registrados aún.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tripHistory.map((trip) => (
                <div 
                  key={trip.id}
                  style={{
                    background: '#131f37',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '14px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{trip.date}</span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: 'rgba(16, 185, 129, 0.15)', 
                      color: '#10b981', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontWeight: 600
                    }}>
                      {trip.status || 'Completado'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f1f5f9' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5ff' }}></div>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{trip.originText}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f1f5f9' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></div>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{trip.destText}</span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '8px',
                    fontSize: '0.78rem',
                    color: '#94a3b8'
                  }}>
                    <div>
                      <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: '0.95rem' }}>${trip.fare}</span>
                      <span style={{ marginLeft: '6px', fontSize: '0.72rem' }}>• {trip.paymentMethod || 'Efectivo'}</span>
                    </div>
                    <button
                      onClick={() => handleRepeatHistoryTrip(trip)}
                      style={{
                        background: 'rgba(0, 229, 255, 0.12)',
                        border: '1px solid rgba(0, 229, 255, 0.3)',
                        borderRadius: '8px',
                        color: '#00e5ff',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Pedir de nuevo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          className="finish-modal-btn"
          style={{ marginTop: '14px' }}
          onClick={() => setHistoryModalOpen(false)}
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  const renderCompletedModal = () => (
    <div className="modal-backdrop">
      <div className="completed-trip-card animate-scale-up">
        <div className="completed-header">
          <div className="check-success-icon">
            <CheckCircle2 size={36} color="#10b981" />
          </div>
          <h3>¡Llegaste a destino!</h3>
          <p>Esperamos que hayas tenido un excelente viaje en Bariloche.</p>
        </div>

        <div className="receipt-summary">
          <div className="receipt-row">
            <span>Distancia recorrida</span>
            <strong>{distanceKm} km</strong>
          </div>
          <div className="receipt-row">
            <span>Medio de pago</span>
            <strong>{paymentMethod === 'cash' ? 'Efectivo al chofer' : 'Transferencia MP'}</strong>
          </div>
          <div className="receipt-divider"></div>
          <div className="receipt-row total">
            <span>Total Abonado</span>
            <span className="total-amount">${calculateFare(selectedCategory) + tip}</span>
          </div>
        </div>

        <div className="rating-section">
          <span className="rating-label">Califica a tu conductor:</span>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                className="star-btn"
                onClick={() => { soundService.playTapSound(); setRating(star); }}
              >
                <Star 
                  size={26} 
                  fill={star <= rating ? '#fbbf24' : 'none'} 
                  color={star <= rating ? '#fbbf24' : '#64748b'} 
                />
              </button>
            ))}
          </div>
        </div>

        <div className="tip-section">
          <span className="tip-label">¿Deseas agregar una propina?</span>
          <div className="tip-chips">
            {[0, 200, 500, 1000].map((amount) => (
              <button 
                key={amount} 
                className={`tip-chip ${tip === amount ? 'active' : ''}`}
                onClick={() => { soundService.playTapSound(); setTip(amount); }}
              >
                {amount === 0 ? 'Sin propina' : `+$${amount}`}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="finish-modal-btn"
          onClick={handleFinishCompletedRide}
        >
          Listo • Guardar en Mis Viajes
        </button>
      </div>
    </div>
  );

  const isPhoneMode = viewMode === 'phone';

  return (
    <div className={`passenger-app-container ${isPhoneMode ? 'mode-phone' : 'mode-desktop'}`}>
      {isPhoneMode ? (
        /* VISTA DISPOSITIVO MÓVIL: EL MAPA ESTÁ 100% ADENTRO DEL SMARTPHONE */
        <>
          <div className="phone-map-pane">
            <BarigoMap 
              pickup={originCoord}
              dropoff={destCoord}
              drivers={liveDrivers}
              assignedDriver={rideState?.driver}
              assignedDriverLoc={(rideState?.driver && Number.isFinite(Number(rideState.driver.lat))) ? { lat: Number(rideState.driver.lat), lng: Number(rideState.driver.lng) } : null}
              routePolyline={routePolyline}
              center={originCoord}
              onMapClick={handleMapClick}
              className="passenger-map-element"
            />

            {/* Header flotante sobre el mapa dentro del teléfono */}
            <div className="phone-map-top-bar">
              <div className="user-pill-mini">
                <div className="user-dot">OS</div>
                <div className="user-details">
                  <span className="user-name">Oscar Stella</span>
                  <span className="user-sub"><Star size={9} fill="#fbbf24" color="#fbbf24" /> 4.98</span>
                </div>
              </div>

              {weatherInfo && (
                <div 
                  className="weather-pill-mini"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    backdropFilter: 'blur(8px)',
                    fontWeight: 700
                  }}
                  title={`Bariloche: ${weatherInfo.condition} • ${weatherInfo.delayText}`}
                >
                  <span>{weatherInfo.icon} {weatherInfo.temperature}°C</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 500 }}>{weatherInfo.delayText}</span>
                </div>
              )}

              <div className="map-quick-actions">
                <button 
                  className="quick-action-btn"
                  onClick={() => setHistoryModalOpen(true)}
                  title="Mis Viajes"
                >
                  <History size={15} color="#00e5ff" />
                </button>
                <button 
                  className={`quick-action-btn ${isLocatingGps ? 'locating' : (isRealGpsActive ? 'gps-active' : '')}`}
                  onClick={() => handleLocateGps(false)}
                  title="GPS Real"
                >
                  <Crosshair size={15} />
                </button>
                <button 
                  className={`quick-action-btn ${voiceMuted ? 'muted' : ''}`}
                  onClick={toggleVoice}
                  title="Voz"
                >
                  {voiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </div>
            </div>

            {/* Alerta automática cuando el chofer está a 1 minuto */}
            {oneMinuteAlert && (
              <div className="passenger-1min-arrival-alert animate-bounce-short">
                <div className="alert-1min-badge">
                  <span className="pulse-dot-red"></span>
                  <strong>🚨 ¡TU AUTO ESTÁ A 1 MINUTO!</strong>
                </div>
                <div className="alert-1min-text">
                  {oneMinuteAlert.message || 'El chofer está a pocos metros de tu ubicación. Salí al punto de encuentro.'}
                </div>
                <button className="alert-1min-btn" onClick={() => setOneMinuteAlert(null)}>
                  Entendido
                </button>
              </div>
            )}

            {/* Alerta si el chofer está llegando */}
            {rideState && rideState.status === 'arriving' && (
              <div className="driver-arriving-banner animate-slide-down">
                <div className="banner-icon-pulse">
                  <Car size={18} color="#00e5ff" />
                </div>
                <div className="banner-text">
                  <strong>¡Chofer en punto de encuentro!</strong>
                  <span>{rideState.driver?.vehicleModel} ({rideState.driver?.vehiclePlate})</span>
                </div>
              </div>
            )}
          </div>

          {/* Panel inferior scrollable dentro del teléfono */}
          <div className="phone-sheet-pane">
            <div className="sheet-drag-pill"></div>
            {renderRideOrBookingContent()}
          </div>
        </>
      ) : (
        /* VISTA ESCRITORIO: DASHBOARD 2 COLUMNAS (SIDEBAR + MAPA COMPLETO) */
        <>
          <div className="desktop-sidebar-pane">
            <div className="desktop-sidebar-header">
              <div className="user-pill-desktop">
                <div className="user-dot">OS</div>
                <div className="user-details">
                  <span className="user-name">Oscar Stella</span>
                  <span className="user-sub"><Star size={11} fill="#fbbf24" color="#fbbf24" /> 4.98 • Pasajero BariGo</span>
                </div>
              </div>
              <div className="map-quick-actions">
                <button 
                  className="quick-action-btn"
                  onClick={() => setHistoryModalOpen(true)}
                  title="Mis Viajes"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', width: 'auto' }}
                >
                  <History size={16} color="#00e5ff" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f1f5f9' }}>Mis Viajes</span>
                </button>
                <button 
                  className={`quick-action-btn ${isLocatingGps ? 'locating' : (isRealGpsActive ? 'gps-active' : '')}`}
                  onClick={() => handleLocateGps(false)}
                  title="GPS Real"
                >
                  <Crosshair size={16} />
                </button>
                <button 
                  className={`quick-action-btn ${voiceMuted ? 'muted' : ''}`}
                  onClick={toggleVoice}
                  title="Voz"
                >
                  {voiceMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>

            <div className="desktop-sidebar-scroll">
              {renderRideOrBookingContent()}
            </div>
          </div>

          <div className="desktop-map-pane">
            <BarigoMap 
              pickup={originCoord}
              dropoff={destCoord}
              drivers={liveDrivers}
              assignedDriver={rideState?.driver}
              assignedDriverLoc={(rideState?.driver && Number.isFinite(Number(rideState.driver.lat))) ? { lat: Number(rideState.driver.lat), lng: Number(rideState.driver.lng) } : null}
              routePolyline={routePolyline}
              center={originCoord}
              onMapClick={handleMapClick}
              className="passenger-map-element"
            />
            {/* Alerta de 1 minuto en vista escritorio */}
            {oneMinuteAlert && (
              <div className="passenger-1min-arrival-alert desktop-position animate-bounce-short">
                <div className="alert-1min-badge">
                  <span className="pulse-dot-red"></span>
                  <strong>🚨 ¡TU AUTO ESTÁ A 1 MINUTO!</strong>
                </div>
                <div className="alert-1min-text">
                  {oneMinuteAlert.message || 'El chofer está a pocos metros de tu ubicación. Salí al punto de encuentro.'}
                </div>
                <button className="alert-1min-btn" onClick={() => setOneMinuteAlert(null)}>
                  Entendido
                </button>
              </div>
            )}

            <div className="desktop-map-badge">
              <span className="live-dot"></span>
              <span>Radar en Tiempo Real • San Carlos de Bariloche</span>
              <span className="drivers-online">({liveDrivers.length} choferes conectados)</span>
            </div>
          </div>
        </>
      )}

      {/* Modal de Historial "Mis Viajes" */}
      {historyModalOpen && renderHistoryModal()}

      {/* Modal de Viaje Finalizado */}
      {completedModalOpen && renderCompletedModal()}
    </div>
  );
}
