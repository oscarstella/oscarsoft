import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  ArrowUp, 
  CornerUpRight, 
  CornerUpLeft, 
  Compass, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Crosshair, 
  Clock, 
  MapPin, 
  Flag, 
  Car, 
  Radio
} from 'lucide-react';
import BarigoMap from '../BarigoMap';
import { voiceService } from '../../services/voiceService';
import { soundService } from '../../services/soundService';
import { syncService } from '../../services/syncService';
import { apiService } from '../../services/apiService';
import { getStreetRoute } from '../../services/routingService';

function cleanText(txt) {
  if (!txt) return '';
  return txt
    .replace(/,?\s*(?:San Carlos de )?Bariloche/gi, '')
    .replace(/,?\s*Río Negro/gi, '')
    .replace(/,?\s*Argentina/gi, '')
    .trim();
}

export default function DriverGpsView({
  activeRide,
  driverLoc,
  driverProfile,
  navPhase,             // 'to_pickup' | 'at_pickup' | 'to_dest'
  onDriverArrived,
  onStartTrip,
  onCompleteTrip,
  viewMode = 'phone'
}) {
  const [navRoutePolyline, setNavRoutePolyline] = useState([]);
  const [navEta, setNavEta] = useState({ mins: 3, km: 1.2 });
  const [navSteps, setNavSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [oneMinAlertSent, setOneMinAlertSent] = useState(false);
  // Evita repetir la locución en cada actualización de GPS (una sola vez por viaje + fase)
  const announcedRef = useRef('');

  // Simulación realista de velocidad GPS si el vehículo está en movimiento
  const simulatedSpeed = navPhase === 'at_pickup' ? 0 : (driverLoc.speed || 38);

  // 1. Trazado y ruteo dinámico según la fase actual del viaje
  useEffect(() => {
    if (!activeRide) return;

    let isMounted = true;

    if (navPhase === 'to_pickup') {
      const pLat = Number(activeRide.originCoord?.lat || activeRide.originLat);
      const pLng = Number(activeRide.originCoord?.lng || activeRide.originLng);
      const originName = cleanText(activeRide.originText || activeRide.originAddress);

      if (pLat && pLng && driverLoc.lat && driverLoc.lng) {
        getStreetRoute(driverLoc.lat, driverLoc.lng, pLat, pLng, originName).then(res => {
          if (!isMounted || !res) return;
          if (res.points) setNavRoutePolyline(res.points);
          setNavEta({ mins: res.durationMin, km: res.distanceKm });
          if (res.steps && res.steps.length > 0) {
            setNavSteps(res.steps);
            const phaseKey = `${activeRide.id}:to_pickup`;
            if (announcedRef.current !== phaseKey) {
              announcedRef.current = phaseKey;
              setCurrentStepIndex(0);
              if (!voiceMuted) {
                const firstStep = res.steps[0];
                const nextStep = res.steps[1];
                const stepToSpeak = nextStep || firstStep;
                if (stepToSpeak?.instruction) {
                  voiceService.speakTurnByTurn(stepToSpeak.instruction, firstStep?.distanceMeters);
                }
              }
            }
          }
        });
      }
    } else if (navPhase === 'at_pickup') {
      // Chofer en el punto de recogida: mostrar ruta preparada hacia destino
      const pLat = Number(activeRide.originCoord?.lat || activeRide.originLat);
      const pLng = Number(activeRide.originCoord?.lng || activeRide.originLng);
      const dLat = Number(activeRide.destCoord?.lat || activeRide.destinationLat);
      const dLng = Number(activeRide.destCoord?.lng || activeRide.destinationLng);
      const destName = cleanText(activeRide.destText || activeRide.destinationAddress);

      if (pLat && pLng && dLat && dLng) {
        getStreetRoute(pLat, pLng, dLat, dLng, destName).then(res => {
          if (!isMounted || !res) return;
          if (res.points) setNavRoutePolyline(res.points);
          setNavEta({ mins: res.durationMin, km: res.distanceKm });
          if (res.steps && res.steps.length > 0) {
            setNavSteps(res.steps);
            setCurrentStepIndex(0);
          }
        });
      }
    } else if (navPhase === 'to_dest') {
      const fromLat = driverLoc.lat;
      const fromLng = driverLoc.lng;
      const dLat = Number(activeRide.destCoord?.lat || activeRide.destinationLat);
      const dLng = Number(activeRide.destCoord?.lng || activeRide.destinationLng);
      const destName = cleanText(activeRide.destText || activeRide.destinationAddress);

      if (fromLat && fromLng && dLat && dLng) {
        getStreetRoute(fromLat, fromLng, dLat, dLng, destName).then(res => {
          if (!isMounted || !res) return;
          if (res.points) setNavRoutePolyline(res.points);
          setNavEta({ mins: res.durationMin, km: res.distanceKm });
          if (res.steps && res.steps.length > 0) {
            setNavSteps(res.steps);
            const phaseKey = `${activeRide.id}:to_dest`;
            if (announcedRef.current !== phaseKey) {
              announcedRef.current = phaseKey;
              setCurrentStepIndex(0);
              if (!voiceMuted) {
                const firstStep = res.steps[0];
                const nextStep = res.steps[1];
                const stepToSpeak = nextStep || firstStep;
                if (stepToSpeak?.instruction) {
                  voiceService.speakTurnByTurn(stepToSpeak.instruction, firstStep?.distanceMeters);
                }
              }
            }
          }
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [activeRide, navPhase, driverLoc.lat, driverLoc.lng, voiceMuted]);

  // 1b. Anunciar cambio de maniobra paso a paso con voz natural
  useEffect(() => {
    if (navSteps.length > 0 && currentStepIndex > 0 && !voiceMuted) {
      const step = navSteps[currentStepIndex];
      if (step?.instruction) {
        voiceService.speakTurnByTurn(step.instruction, step.distanceMeters);
      }
    }
  }, [currentStepIndex, navSteps, voiceMuted]);

  // 2. DISPARO AUTOMÁTICO DE ALERTA DE 1 MINUTO AL PASAJERO
  // "el pasajero tiene que recibir una respuesta automatica cuando el chofer esta a 1 minuto de llegar"
  useEffect(() => {
    if (navPhase === 'to_pickup' && !oneMinAlertSent) {
      // Dispara automáticamente cuando el tiempo estimado es <= 1 minuto o distancia <= 0.5km
      if (navEta.mins <= 1 || navEta.km <= 0.5) {
        triggerOneMinuteAlert();
      }
    }
  }, [navPhase, navEta.mins, navEta.km, oneMinAlertSent]);

  const triggerOneMinuteAlert = () => {
    if (oneMinAlertSent) return;
    setOneMinAlertSent(true);

    const alertPayload = {
      rideId: activeRide?.id,
      driverName: driverProfile?.name || 'Carlos Nahuel Huapi',
      driverVehicle: `${driverProfile?.vehicleModel || 'Chevrolet Onix'} (${driverProfile?.vehiclePlate || 'AF 342 BZ'})`,
      message: '¡Hola! Estoy a 1 minuto de llegar a tu ubicación. Por favor salí al punto de encuentro.',
      etaMins: 1,
      timestamp: Date.now()
    };

    // 1. Sincronización Web BroadcastChannel
    syncService.emit('DRIVER_1MIN_ALERT', alertPayload);

    // 2. Transmisión Socket al backend
    const socket = apiService.getSocket();
    if (socket) {
      socket.emit('ride:one_minute_alert', alertPayload);
    }

    // 3. Audio de confirmación local para el chofer
    soundService.playChimeTone();
    voiceService.speak("Aviso automático enviado: Llegando en un minuto al punto de encuentro.");
  };

  const toggleVoice = () => {
    const newState = voiceService.toggle();
    setVoiceMuted(!newState);
    if (newState) {
      voiceService.speak("Voz de navegación activada.");
    }
  };

  const currentStep = navSteps[currentStepIndex] || {
    instruction: navPhase === 'to_pickup' 
      ? `Diríjase al punto de encuentro en ${cleanText(activeRide.originText)}`
      : navPhase === 'at_pickup'
      ? 'Esperando al pasajero en el punto de encuentro'
      : `Diríjase hacia el destino en ${cleanText(activeRide.destText)}`,
    street: navPhase === 'to_pickup' ? cleanText(activeRide.originText) : cleanText(activeRide.destText),
    distanceMeters: Math.round((navEta.km || 1) * 1000),
    modifier: 'straight'
  };

  const renderManeuverIcon = (modifier) => {
    if (!modifier) return <Navigation size={28} color="#00e5ff" />;
    const mod = modifier.toLowerCase();
    if (mod.includes('left')) return <CornerUpLeft size={28} color="#00e5ff" />;
    if (mod.includes('right')) return <CornerUpRight size={28} color="#00e5ff" />;
    if (mod.includes('arrive')) return <Flag size={28} color="#10b981" />;
    return <ArrowUp size={28} color="#00e5ff" />;
  };

  // Cálculo de hora estimada de arribo (reloj)
  const arrivalTime = () => {
    const d = new Date(Date.now() + (navEta.mins || 3) * 60000);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`barigo-gps-cockpit ${viewMode === 'fullscreen' ? 'gps-mode-fullscreen' : 'gps-mode-phone'}`}>
      {/* 🗺️ MAPA NAVEGACIÓN GPS A PANTALLA COMPLETA */}
      <div className="gps-map-viewport">
        <BarigoMap 
          pickup={navPhase === 'to_pickup' ? { lat: driverLoc.lat, lng: driverLoc.lng } : (activeRide?.originCoord || null)}
          dropoff={navPhase === 'to_pickup' ? (activeRide?.originCoord || null) : (activeRide?.destCoord || null)}
          pickupLabel={navPhase === 'to_pickup' ? "Mi GPS" : "Origen"}
          dropoffLabel={navPhase === 'to_pickup' ? `Pasajero (${activeRide?.passengerName?.split(' ')[0] || 'Buscar'})` : "Destino"}
          hidePickupMarker={navPhase === 'to_pickup'}
          drivers={[]}
          assignedDriver={driverProfile}
          assignedDriverLoc={{ lat: driverLoc.lat, lng: driverLoc.lng }}
          routePolyline={navRoutePolyline}
          center={{ lat: driverLoc.lat, lng: driverLoc.lng }}
          zoom={16}
          className="driver-map-element gps-nav-tiles"
        />

        {/* 🟢 BANNER SUPERIOR GPS ESTILO WAZE / GOOGLE MAPS */}
        <div className="gps-top-instruction-card animate-slide-down">
          <div className="gps-instruction-main">
            <div className="gps-turn-icon-bubble">
              {renderManeuverIcon(currentStep.modifier)}
            </div>
            <div className="gps-instruction-details">
              <div className="gps-distance-counter">
                {currentStep.distanceMeters > 1000 
                  ? `${(currentStep.distanceMeters / 1000).toFixed(1)} km` 
                  : `${currentStep.distanceMeters} m`}
              </div>
              <div className="gps-step-text">
                {currentStep.instruction}
              </div>
              <div className="gps-target-street">
                {navPhase === 'to_pickup' && (
                  <span className="gps-target-badge pickup">
                    📍 Hacia origen: {cleanText(activeRide.originText)}
                  </span>
                )}
                {navPhase === 'at_pickup' && (
                  <span className="gps-target-badge arrived">
                    ✅ En el origen: Pasajero abordando
                  </span>
                )}
                {navPhase === 'to_dest' && (
                  <span className="gps-target-badge dest">
                    🏁 Hacia destino: {cleanText(activeRide.destText)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="gps-instruction-actions">
            <button 
              className="gps-pill-btn" 
              onClick={() => {
                voiceService.unlockAudio();
                const step = navSteps[currentStepIndex] || currentStep;
                if (step) {
                  voiceService.speakTurnByTurn(step.instruction, step.distanceMeters);
                }
              }}
              title="Escuchar indicación por voz"
            >
              <Volume2 size={16} color="#00e5ff" />
              <span>Escuchar</span>
            </button>
            {navSteps.length > 1 && (
              <button 
                className="gps-pill-btn" 
                onClick={() => {
                  voiceService.unlockAudio();
                  const nextIdx = (currentStepIndex + 1) % navSteps.length;
                  setCurrentStepIndex(nextIdx);
                  const step = navSteps[nextIdx];
                  if (step) {
                    voiceService.speakTurnByTurn(step.instruction, step.distanceMeters);
                  }
                }}
                title="Siguiente indicación de la ruta"
              >
                <span>Paso {currentStepIndex + 1}/{navSteps.length}</span>
              </button>
            )}
            <button 
              className={`gps-pill-btn voice-btn ${voiceMuted ? 'muted' : ''}`}
              onClick={toggleVoice}
              title={voiceMuted ? "Activar voz" : "Silenciar voz"}
            >
              {voiceMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{voiceMuted ? 'Voz silenciada' : 'Voz activa'}</span>
            </button>
          </div>
        </div>

        {/* 📟 VELOCÍMETRO Y BRÚJULA FLOTANTE */}
        <div className="gps-floating-hud">
          <div className="gps-speedometer-box">
            <span className="speed-number">{simulatedSpeed}</span>
            <span className="speed-unit">km/h</span>
          </div>

          <div className="gps-compass-badge">
            <Compass size={14} color="#00e5ff" />
            <span>NORTE GPS</span>
          </div>

          {navPhase === 'to_pickup' && (
            <div className={`gps-1min-badge ${oneMinAlertSent ? 'sent' : 'pending'}`}>
              <Radio size={12} className="pulse-icon" />
              <span>{oneMinAlertSent ? 'Alerta 1 min enviada al pasajero' : 'Monitoreando arribo a 1 min'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 🧭 PANEL INFERIOR DE NAVEGACIÓN Y CONTROL EN LA MISMA VISTA */}
      <div className="gps-bottom-control-sheet animate-slide-up">
        {/* Telemetría ETA Superior */}
        <div className="gps-eta-summary-bar">
          <div className="eta-main-stat">
            <span className="eta-big-minutes">{navEta.mins || 3}</span>
            <span className="eta-min-label">min</span>
          </div>
          <div className="eta-divider"></div>
          <div className="eta-sub-stat">
            <span className="eta-sub-val">{navEta.km || 1.2} km</span>
            <span className="eta-sub-label">Distancia</span>
          </div>
          <div className="eta-divider"></div>
          <div className="eta-sub-stat">
            <span className="eta-sub-val">{arrivalTime()}</span>
            <span className="eta-sub-label">Hora llegada</span>
          </div>

          {/* Botón rápido para testear alerta de 1 minuto si el usuario quiere probarla ya */}
          {navPhase === 'to_pickup' && !oneMinAlertSent && (
            <button 
              className="gps-test-1min-btn" 
              onClick={triggerOneMinuteAlert}
              title="Disparar aviso de 1 minuto de llegada ahora"
            >
              🚨 Enviar aviso 1 min
            </button>
          )}
        </div>

        {/* Ficha del Pasajero y Datos de Contacto */}
        <div className="gps-passenger-meta-row">
          <div className="pas-identity">
            <div className="pas-avatar-circle">
              {activeRide.passengerName?.charAt(0) || 'P'}
            </div>
            <div className="pas-names">
              <strong>{activeRide.passengerName}</strong>
              <div className="pas-badges">
                <span className="pin-tag">PIN: {activeRide.pin || '8419'}</span>
                <span className="fare-tag">${activeRide.fare} ARS</span>
              </div>
            </div>
          </div>

          <div className="pas-quick-contact-btns">
            <a href={`tel:${activeRide.passengerPhone || '+5492944001122'}`} className="contact-icon-btn phone" title="Llamar">
              <Phone size={18} />
            </a>
            <a 
              href={`https://wa.me/5492944001122?text=Hola,%20soy%20tu%20chofer%20de%20BariGo.%20Estoy%20en%20camino.`} 
              target="_blank" 
              rel="noreferrer" 
              className="contact-icon-btn whatsapp" 
              title="WhatsApp"
            >
              <MessageSquare size={18} />
            </a>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTÓN DE ACCIÓN SECUENCIAL EN LA MISMA VISTA                 */}
        {/* ============================================================ */}
        <div className="gps-action-slot">
          {navPhase === 'to_pickup' && (
            <button className="gps-master-btn btn-arrived-pickup" onClick={onDriverArrived}>
              <CheckCircle2 size={20} />
              <span>1. Llegué al Punto de Encuentro (Notificar)</span>
            </button>
          )}

          {navPhase === 'at_pickup' && (
            <button className="gps-master-btn btn-start-dest" onClick={onStartTrip}>
              <Navigation size={20} />
              <span>2. Iniciar Viaje hacia el Destino Final</span>
            </button>
          )}

          {navPhase === 'to_dest' && (
            <button className="gps-master-btn btn-complete-trip" onClick={onCompleteTrip}>
              <CheckCircle2 size={20} />
              <span>3. Finalizar Viaje y Cobrar ${activeRide.fare}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
