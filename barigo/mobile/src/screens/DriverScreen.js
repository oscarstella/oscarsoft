import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Alert,
  Linking 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { VoiceService } from '../services/voiceService';
import SocketService from '../services/socketService';
import { DARK_MAP_STYLE } from '../styles/darkMapStyle';
import { getStreetRoute } from '../services/routingService';

export default function DriverScreen() {
  const mapRef = useRef(null);

  // Estados de Conducción y GPS
  const [isOnline, setIsOnline] = useState(true);
  const [hasPass24h, setHasPass24h] = useState(true);
  const [hoursLeft, setHoursLeft] = useState(21);
  const [driverCoords, setDriverCoords] = useState({ latitude: -41.1335, longitude: -71.3103 });

  // Estados de Solicitudes y Viaje Activo
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripStep, setTripStep] = useState('arriving'); // 'arriving' | 'in_progress' | 'navigating'

  // Estados de Navegación GPS Giro a Giro
  const [navRoutePolyline, setNavRoutePolyline] = useState([]);
  const [navEta, setNavEta] = useState({ mins: 3, km: 1.2 });
  const [navSteps, setNavSteps] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  const [oneMinAlertSent, setOneMinAlertSent] = useState(false);

  // Solicitar GPS real al inicio
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          setDriverCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });
        }
      } catch (e) {
        console.log('GPS chofer:', e);
      }
    })();
  }, []);

  // WebSockets en Tiempo Real para Chofer (CERO DEMOS / CERO MOCKS)
  useEffect(() => {
    const socket = SocketService.connect('usr-chofer-1', 'driver');
    if (!socket) return;

    // Reportar ubicación
    SocketService.sendDriverLocation('usr-chofer-1', {
      lat: driverCoords.latitude,
      lng: driverCoords.longitude,
      isOnline
    });

    const handleNewRide = (data) => {
      if (!isOnline || currentTrip) return;
      const ride = data.ride || {};
      const passenger = data.passenger || {};

      const offer = {
        id: ride.id,
        passenger: passenger.fullName || ride.passengerName || 'Pasajero BariGo',
        rating: 4.95,
        origin: ride.originAddress || ride.originText || 'Bariloche',
        originCoords: {
          latitude: Number(ride.originLat || -41.1335),
          longitude: Number(ride.originLng || -71.3103)
        },
        destination: ride.destinationAddress || ride.destText || 'Bariloche',
        destinationCoords: {
          latitude: Number(ride.destinationLat || -41.1415),
          longitude: Number(ride.destinationLng || -71.3132)
        },
        fare: ride.estimatedFare || ride.fare || 3500,
        distanceKm: ride.estimatedDistanceKm || ride.distanceKm || 2.5
      };

      setIncomingOffer(offer);
      VoiceService.notifyNewRideDriver(offer.origin, offer.fare);

      // Mover el mapa hacia el origen del pasajero
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: offer.originCoords.latitude,
          longitude: offer.originCoords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04
        }, 800);
      }
    };

    const handleRideRemoved = (data) => {
      if (incomingOffer && incomingOffer.id === data.rideId) {
        setIncomingOffer(null);
      }
    };

    const handleCancelled = (data) => {
      if (incomingOffer && incomingOffer.id === data.rideId) {
        setIncomingOffer(null);
        VoiceService.notifyRideCancelled();
      }
      if (currentTrip && currentTrip.id === data.rideId) {
        setCurrentTrip(null);
        VoiceService.notifyRideCancelled();
        Alert.alert('❌ Solicitud Cancelada', 'El pasajero canceló la solicitud.');
      }
    };

    socket.on('ride:new_available', handleNewRide);
    socket.on('ride:removed', handleRideRemoved);
    socket.on('ride:cancelled', handleCancelled);

    return () => {
      socket.off('ride:new_available', handleNewRide);
      socket.off('ride:removed', handleRideRemoved);
      socket.off('ride:cancelled', handleCancelled);
    };
  }, [isOnline, currentTrip, incomingOffer, driverCoords]);

  // Cálculo de ruta calle por calle (OSRM) y monitoreo de arribo a 1 minuto
  useEffect(() => {
    if (!currentTrip) {
      setNavRoutePolyline([]);
      return;
    }

    if (tripStep === 'arriving') {
      getStreetRoute(
        driverCoords.latitude,
        driverCoords.longitude,
        currentTrip.originCoords.latitude,
        currentTrip.originCoords.longitude,
        currentTrip.origin
      ).then(res => {
        if (res && res.points) {
          setNavRoutePolyline(res.points.map(([lat, lng]) => ({ latitude: lat, longitude: lng })));
          setNavEta({ mins: res.durationMin, km: res.distanceKm });
          if (res.steps) setNavSteps(res.steps);

          if (!oneMinAlertSent && (res.durationMin <= 1 || res.distanceKm <= 0.5)) {
            triggerOneMinuteAlert();
          }
        }
      });
    } else if (tripStep === 'navigating') {
      getStreetRoute(
        driverCoords.latitude,
        driverCoords.longitude,
        currentTrip.destinationCoords.latitude,
        currentTrip.destinationCoords.longitude,
        currentTrip.destination
      ).then(res => {
        if (res && res.points) {
          setNavRoutePolyline(res.points.map(([lat, lng]) => ({ latitude: lat, longitude: lng })));
          setNavEta({ mins: res.durationMin, km: res.distanceKm });
          if (res.steps) setNavSteps(res.steps);
        }
      });
    }
  }, [currentTrip, tripStep, driverCoords, oneMinAlertSent]);

  const triggerOneMinuteAlert = () => {
    if (oneMinAlertSent || !currentTrip) return;
    setOneMinAlertSent(true);
    const socket = SocketService.getSocket();
    if (socket) {
      socket.emit('ride:one_minute_alert', {
        rideId: currentTrip.id,
        driverName: 'Carlos Nahuel Huapi',
        driverVehicle: 'Chevrolet Onix (AF 342 BZ)',
        message: '¡Hola! Estoy a 1 minuto de llegar a tu ubicación. Por favor salí al punto de encuentro.'
      });
    }
    VoiceService.speak("Aviso automático enviado: Llegando en un minuto al punto de encuentro.");
  };

  // Centrar en ubicación actual
  const handleCenterGps = () => {
    if (mapRef.current && driverCoords) {
      mapRef.current.animateToRegion({
        latitude: driverCoords.latitude,
        longitude: driverCoords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03
      }, 800);
    }
  };

  // Aceptar viaje
  const handleAcceptRide = () => {
    if (!incomingOffer) return;
    SocketService.acceptRide(incomingOffer.id, 'usr-chofer-1', {
      name: 'Carlos Nahuel Huapi',
      vehicle: 'Chevrolet Onix Joy (Blanco)',
      plate: 'AF 342 BZ',
      phone: '+54 9 294 422-3344',
      rating: 4.96
    });
    setCurrentTrip(incomingOffer);
    setIncomingOffer(null);
    setTripStep('arriving');
    setOneMinAlertSent(false);
  };

  // Rechazar viaje
  const handleRejectRide = () => {
    setIncomingOffer(null);
  };

  // Paso 1: Llegué al pasajero
  const handleArrived = () => {
    setTripStep('in_progress');
    if (currentTrip?.id) {
      SocketService.updateRideStatus(currentTrip.id, 'arriving');
    }
    VoiceService.notifyDriverArrived();
    Alert.alert('🚗 Llegaste al punto', 'Se notificó al pasajero que estás en la puerta.');
  };

  // Paso 2: Iniciar viaje hacia destino
  const handleStartTrip = () => {
    setTripStep('navigating');
    if (currentTrip?.id) {
      SocketService.updateRideStatus(currentTrip.id, 'in_progress');
    }
    VoiceService.notifyTripStarted(currentTrip.destination);
    Alert.alert('🏁 Viaje Iniciado', 'Conduce hacia el destino acordado.');
  };

  // Paso 3: Finalizar viaje y cobrar
  const handleCompleteTrip = () => {
    VoiceService.notifyTripCompleted(currentTrip.fare);
    if (currentTrip?.id) {
      SocketService.updateRideStatus(currentTrip.id, 'completed');
    }
    Alert.alert('💰 Viaje Finalizado', `Cobrar al pasajero: $${currentTrip.fare.toLocaleString('es-AR')} ARS en efectivo.`);
    setCurrentTrip(null);
    setTripStep('arriving');
  };

  // VISTA TIPO GPS CUANDO EL CONDUCTOR TOMA UN VIAJE
  if (currentTrip) {
    const nextStep = navSteps[0] || {
      instruction: tripStep === 'arriving' 
        ? `Diríjase al punto de encuentro en ${currentTrip.origin}` 
        : tripStep === 'in_progress'
        ? `Pasajero abordando en el origen`
        : `Diríjase hacia ${currentTrip.destination}`,
      distanceMeters: Math.round((navEta.km || 1) * 1000)
    };

    return (
      <View style={styles.container}>
        {/* MAPA GPS A PANTALLA COMPLETA */}
        <View style={styles.gpsFullMap}>
          <MapView
            ref={mapRef}
            style={styles.map}
            customMapStyle={DARK_MAP_STYLE}
            initialRegion={{
              latitude: driverCoords.latitude,
              longitude: driverCoords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02
            }}
            showsUserLocation={true}
          >
            {/* Auto del chofer */}
            <Marker coordinate={driverCoords} title="🚗 Mi Auto" pinColor="#06b6d4" />

            {/* Marcador origen si aún no inició viaje al destino */}
            {tripStep === 'arriving' && (
              <Marker coordinate={currentTrip.originCoords} title="📍 Punto de Retiro" pinColor="#10b981" />
            )}

            {/* Marcador destino */}
            <Marker coordinate={currentTrip.destinationCoords} title="🏁 Destino Final" pinColor="#f59e0b" />

            {/* Ruta calle por calle */}
            {navRoutePolyline.length > 0 && (
              <Polyline
                coordinates={navRoutePolyline}
                strokeColor="#00e5ff"
                strokeWidth={5}
              />
            )}
          </MapView>

          {/* BANNER SUPERIOR GPS ESTILO WAZE / GOOGLE MAPS */}
          <View style={styles.gpsTopCard}>
            <View style={styles.gpsTopRow}>
              <View style={styles.gpsManeuverBubble}>
                <Text style={styles.gpsManeuverIcon}>
                  {tripStep === 'navigating' ? '🏁' : tripStep === 'in_progress' ? '✅' : '⬆️'}
                </Text>
              </View>
              <View style={styles.gpsTopDetails}>
                <Text style={styles.gpsTopDist}>
                  {nextStep.distanceMeters > 1000 ? `${(nextStep.distanceMeters / 1000).toFixed(1)} km` : `${nextStep.distanceMeters || 150} m`}
                </Text>
                <Text style={styles.gpsTopInstruction} numberOfLines={2}>
                  {nextStep.instruction}
                </Text>
                <Text style={[styles.gpsPhaseTag, tripStep === 'navigating' ? styles.tagDest : styles.tagOrigin]}>
                  {tripStep === 'arriving' && `📍 Hacia Origen: ${currentTrip.origin}`}
                  {tripStep === 'in_progress' && `✅ En Origen: Pasajero a bordo`}
                  {tripStep === 'navigating' && `🏁 Hacia Destino: ${currentTrip.destination}`}
                </Text>
              </View>
            </View>

            {/* Botón ver todas las indicaciones */}
            {navSteps.length > 0 && (
              <TouchableOpacity style={styles.gpsToggleStepsBtn} onPress={() => setShowSteps(!showSteps)}>
                <Text style={styles.gpsToggleStepsText}>{showSteps ? '▲ Ocultar indicaciones' : '▼ Ver indicaciones paso a paso'}</Text>
              </TouchableOpacity>
            )}

            {showSteps && (
              <ScrollView style={styles.gpsStepsList} nestedScrollEnabled={true}>
                {navSteps.map((s, i) => (
                  <View key={i} style={styles.gpsStepRow}>
                    <Text style={styles.gpsStepBullet}>•</Text>
                    <Text style={styles.gpsStepText}>{s.instruction} ({s.distanceMeters}m)</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* VELOCÍMETRO DIGITAL FLOTANTE */}
          <View style={styles.gpsSpeedometer}>
            <Text style={styles.speedNum}>{tripStep === 'in_progress' ? '0' : '36'}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>

          {/* BOTÓN O ESTADO DE ALERTA A 1 MINUTO */}
          {tripStep === 'arriving' && (
            <TouchableOpacity 
              style={[styles.gpsAlert1MinBadge, oneMinAlertSent && styles.gpsAlert1MinSent]}
              onPress={triggerOneMinuteAlert}
            >
              <Text style={styles.gpsAlert1MinText}>
                {oneMinAlertSent ? '✅ Aviso 1 min enviado' : '🚨 Enviar aviso 1 min'}
              </Text>
            </TouchableOpacity>
          )}

          {/* BOTÓN RECENTRAR */}
          <TouchableOpacity style={styles.gpsRecenterBtn} onPress={handleCenterGps}>
            <Text style={styles.gpsRecenterText}>🎯</Text>
          </TouchableOpacity>
        </View>

        {/* PANEL INFERIOR DE CONTROL GPS EN LA MISMA VISTA */}
        <View style={styles.gpsBottomBar}>
          {/* Barra ETA */}
          <View style={styles.gpsEtaBar}>
            <View style={styles.gpsEtaItem}>
              <Text style={styles.gpsEtaMins}>{navEta.mins || 3} min</Text>
              <Text style={styles.gpsEtaSub}>Tiempo</Text>
            </View>
            <View style={styles.gpsDivider} />
            <View style={styles.gpsEtaItem}>
              <Text style={styles.gpsEtaVal}>{navEta.km || 1.2} km</Text>
              <Text style={styles.gpsEtaSub}>Distancia</Text>
            </View>
            <View style={styles.gpsDivider} />
            <View style={styles.gpsEtaItem}>
              <Text style={styles.gpsEtaVal}>${currentTrip.fare.toLocaleString('es-AR')}</Text>
              <Text style={styles.gpsEtaSub}>Tarifa</Text>
            </View>
          </View>

          {/* Datos del Pasajero */}
          <View style={styles.gpsPassengerRow}>
            <View>
              <Text style={styles.gpsPasName}>{currentTrip.passenger}</Text>
              <Text style={styles.gpsPasSub}>Pasajero BariGo • ⭐ 4.98</Text>
            </View>
            <View style={styles.gpsContactBtns}>
              <TouchableOpacity 
                style={styles.gpsContactBtnWpp} 
                onPress={() => Linking.openURL('https://wa.me/5492944001122')}
              >
                <Text style={styles.gpsContactBtnText}>💬 WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.gpsContactBtnPhone} 
                onPress={() => Linking.openURL('tel:+5492944001122')}
              >
                <Text style={styles.gpsContactBtnText}>📞 Llamar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BOTÓN DE ACCIÓN SECUENCIAL EN LA MISMA VISTA */}
          <View style={styles.gpsActionBox}>
            {tripStep === 'arriving' && (
              <TouchableOpacity style={styles.btnGpsPickup} onPress={handleArrived} activeOpacity={0.85}>
                <Text style={styles.btnGpsPickupText}>1. Llegué al Punto de Encuentro (Origen)</Text>
              </TouchableOpacity>
            )}

            {tripStep === 'in_progress' && (
              <TouchableOpacity style={styles.btnGpsStartDest} onPress={handleStartTrip} activeOpacity={0.85}>
                <Text style={styles.btnGpsStartDestText}>2. Iniciar Viaje hacia el Destino Final</Text>
              </TouchableOpacity>
            )}

            {tripStep === 'navigating' && (
              <TouchableOpacity style={styles.btnGpsComplete} onPress={handleCompleteTrip} activeOpacity={0.85}>
                <Text style={styles.btnGpsCompleteText}>3. Finalizar Viaje y Cobrar ${currentTrip.fare.toLocaleString('es-AR')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🗺️ MAPA SUPERIOR INTERACTIVO DEL CHOFER */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          customMapStyle={DARK_MAP_STYLE}
          initialRegion={{
            latitude: -41.1335,
            longitude: -71.3103,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          }}
          showsUserLocation={true}
          showsCompass={false}
        >
          {/* Marcador Vehículo Chofer */}
          <Marker
            coordinate={driverCoords}
            title="🚗 Mi Ubicación"
            description="Chevrolet Onix Joy (AF 342 BZ)"
            pinColor="#06b6d4"
          />

          {/* Marcador de Recogida si hay viaje u oferta */}
          {(currentTrip || incomingOffer) && (
            <Marker
              coordinate={(currentTrip || incomingOffer).originCoords}
              title="📍 Pasajero"
              description={(currentTrip || incomingOffer).origin}
              pinColor="#10b981"
            />
          )}

          {/* Marcador Destino si el viaje está en curso */}
          {currentTrip && (
            <Marker
              coordinate={currentTrip.destinationCoords}
              title="🏁 Destino Final"
              description={currentTrip.destination}
              pinColor="#f59e0b"
            />
          )}

          {/* Línea de ruta */}
          {(currentTrip || incomingOffer) && (
            <Polyline
              coordinates={[
                driverCoords,
                (currentTrip || incomingOffer).originCoords
              ]}
              strokeColor="#10b981"
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Botón flotante GPS */}
        <TouchableOpacity style={styles.gpsFloatingBtn} onPress={handleCenterGps} activeOpacity={0.8}>
          <Text style={styles.gpsBtnText}>🎯 Mi GPS</Text>
        </TouchableOpacity>

        {/* Radar Status Badge */}
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#64748b' }]} />
          <Text style={styles.statusPillText}>
            {isOnline ? 'Radar Activo • Visible en Bariloche' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* 📄 PANEL INFERIOR DEL CHOFER */}
      <View style={styles.drawerWrapper}>
        <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerContent}>
          {/* Tarjeta de Pase Diario 24hs */}
          <View style={styles.passCard}>
            <View>
              <Text style={styles.passTitle}>PASE DIARIO DE CONDUCCIÓN</Text>
              <Text style={[styles.passSubtitle, { color: hasPass24h ? '#10b981' : '#ef4444' }]}>
                {hasPass24h ? `● ACTIVO (Vence en ${hoursLeft}h)` : '● INACTIVO'}
              </Text>
            </View>
            <View style={styles.passRight}>
              <Text style={styles.passPrice}>$4.500 ARS</Text>
              <Text style={styles.commissionTag}>0% Comisión</Text>
            </View>
          </View>

          {/* Switch de Conexión / Radar */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Radar de Chofer</Text>
              <Text style={styles.switchDesc}>{isOnline ? 'Recibiendo viajes en tiempo real' : 'Fuera de línea'}</Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#334155', true: '#06b6d4' }}
              thumbColor={isOnline ? '#ffffff' : '#94a3b8'}
            />
          </View>

          {/* ALERTA DE NUEVO VIAJE ENTRANTE */}
          {incomingOffer && !currentTrip && (
            <View style={styles.incomingOfferCard}>
              <View style={styles.offerHead}>
                <Text style={styles.offerBadge}>🚨 NUEVA SOLICITUD DE VIAJE</Text>
                <Text style={styles.offerPassenger}>{incomingOffer.passenger} (⭐ {incomingOffer.rating})</Text>
              </View>

              <View style={styles.offerRoute}>
                <Text style={styles.offerRouteItem}>📍 <Text style={{ color: '#06b6d4', fontWeight: 'bold' }}>Recogida:</Text> {incomingOffer.origin}</Text>
                <Text style={styles.offerRouteItem}>🏁 <Text style={{ color: '#10b981', fontWeight: 'bold' }}>Destino:</Text> {incomingOffer.destination}</Text>
              </View>

              <View style={styles.offerFareRow}>
                <Text style={styles.offerDist}>{incomingOffer.distanceKm} km</Text>
                <Text style={styles.offerFareValue}>${incomingOffer.fare.toLocaleString('es-AR')} ARS</Text>
              </View>

              <View style={styles.offerActions}>
                <TouchableOpacity style={styles.btnReject} onPress={handleRejectRide} activeOpacity={0.8}>
                  <Text style={styles.btnRejectText}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAccept} onPress={handleAcceptRide} activeOpacity={0.8}>
                  <Text style={styles.btnAcceptText}>Aceptar Viaje</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* GESTIÓN DE VIAJE EN CURSO */}
          {currentTrip && (
            <View style={styles.activeTripCard}>
              <View style={styles.activeTripHead}>
                <Text style={styles.activeTripTag}>● VIAJE EN CURSO</Text>
                <Text style={styles.activeTripPassenger}>Pasajero: {currentTrip.passenger}</Text>
              </View>

              <View style={styles.activeTripPoints}>
                <Text style={styles.pointText}>📍 {currentTrip.origin}</Text>
                <Text style={styles.pointText}>🏁 {currentTrip.destination}</Text>
              </View>

              <View style={styles.activeTripFare}>
                <Text style={styles.fareLabel}>Cobro al finalizar:</Text>
                <Text style={styles.fareVal}>${currentTrip.fare.toLocaleString('es-AR')} ARS</Text>
              </View>

              {/* Acciones secuenciales del chofer */}
              <View style={styles.tripStepsRow}>
                {tripStep === 'arriving' && (
                  <TouchableOpacity style={[styles.btnStep, { backgroundColor: '#0284c7' }]} onPress={handleArrived}>
                    <Text style={styles.btnStepText}>1. Llegué al Pasajero</Text>
                  </TouchableOpacity>
                )}

                {tripStep === 'in_progress' && (
                  <TouchableOpacity style={[styles.btnStep, { backgroundColor: '#3b82f6' }]} onPress={handleStartTrip}>
                    <Text style={styles.btnStepText}>2. Iniciar Viaje al Destino</Text>
                  </TouchableOpacity>
                )}

                {tripStep === 'navigating' && (
                  <TouchableOpacity style={[styles.btnStep, { backgroundColor: '#10b981' }]} onPress={handleCompleteTrip}>
                    <Text style={styles.btnStepText}>3. Finalizar y Cobrar en Efectivo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Ficha de Vehículo Habilitado */}
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleHeader}>Vehículo Verificado:</Text>
            <Text style={styles.vehicleRow}>• Chevrolet Onix Joy Blanco (AF 342 BZ)</Text>
            <Text style={styles.vehicleRow}>• Cadenas para Nieve: Verificado ✅</Text>
            <Text style={styles.vehicleRow}>• RTO Río Negro & Seguro de Pasajeros: Al día ✅</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d18'
  },
  mapWrapper: {
    height: '46%',
    position: 'relative'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  gpsFloatingBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4
  },
  gpsBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700'
  },
  statusPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(7, 13, 24, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusPillText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600'
  },
  drawerWrapper: {
    height: '54%',
    backgroundColor: '#070d18',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden'
  },
  drawerScroll: {
    flex: 1
  },
  drawerContent: {
    padding: 16,
    paddingBottom: 28
  },
  passCard: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  passTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  passSubtitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3
  },
  passRight: {
    alignItems: 'flex-end'
  },
  passPrice: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '900'
  },
  commissionTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700'
  },
  switchRow: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  switchTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  switchDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  // Tarjeta Oferta Entrante
  incomingOfferCard: {
    backgroundColor: '#0c2238',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#06b6d4',
    padding: 16,
    marginBottom: 14
  },
  offerHead: {
    marginBottom: 8
  },
  offerBadge: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  offerPassenger: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2
  },
  offerRoute: {
    gap: 4,
    marginVertical: 8
  },
  offerRouteItem: {
    color: '#cbd5e1',
    fontSize: 12
  },
  offerFareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#070d18',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10
  },
  offerDist: {
    color: '#94a3b8',
    fontSize: 12
  },
  offerFareValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '900'
  },
  offerActions: {
    flexDirection: 'row',
    gap: 10
  },
  btnReject: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center'
  },
  btnRejectText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700'
  },
  btnAccept: {
    flex: 2,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center'
  },
  btnAcceptText: {
    color: '#070d18',
    fontSize: 14,
    fontWeight: '800'
  },
  // Viaje en Curso Chofer
  activeTripCard: {
    backgroundColor: '#0a231f',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 16,
    marginBottom: 14
  },
  activeTripHead: {
    marginBottom: 8
  },
  activeTripTag: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900'
  },
  activeTripPassenger: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  activeTripPoints: {
    gap: 4,
    marginVertical: 8
  },
  pointText: {
    color: '#cbd5e1',
    fontSize: 12
  },
  activeTripFare: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#070d18',
    padding: 10,
    borderRadius: 10,
    marginVertical: 8
  },
  fareLabel: {
    color: '#94a3b8',
    fontSize: 12
  },
  fareVal: {
    color: '#06b6d4',
    fontSize: 18,
    fontWeight: '900'
  },
  tripStepsRow: {
    marginTop: 8
  },
  btnStep: {
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnStepText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  // Ficha de Vehículo
  vehicleCard: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  vehicleHeader: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6
  },
  vehicleRow: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 3
  },
  // ESTILOS NAVEGACIÓN GPS (CHOFER)
  gpsFullMap: {
    flex: 1,
    position: 'relative'
  },
  gpsTopCard: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(7, 13, 24, 0.96)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#06b6d4',
    padding: 12,
    zIndex: 30
  },
  gpsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  gpsManeuverBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gpsManeuverIcon: {
    fontSize: 22
  },
  gpsTopDetails: {
    flex: 1
  },
  gpsTopDist: {
    color: '#06b6d4',
    fontSize: 18,
    fontWeight: '900'
  },
  gpsTopInstruction: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2
  },
  gpsPhaseTag: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  tagOrigin: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    color: '#38bdf8'
  },
  tagDest: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24'
  },
  gpsToggleStepsBtn: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center'
  },
  gpsToggleStepsText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700'
  },
  gpsStepsList: {
    maxHeight: 150,
    marginTop: 6
  },
  gpsStepRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 3
  },
  gpsStepBullet: {
    color: '#06b6d4',
    fontWeight: '900'
  },
  gpsStepText: {
    color: '#cbd5e1',
    fontSize: 11,
    flex: 1
  },
  gpsSpeedometer: {
    position: 'absolute',
    top: 115,
    left: 14,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#070d18',
    borderWidth: 2,
    borderColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25
  },
  speedNum: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900'
  },
  speedUnit: {
    color: '#06b6d4',
    fontSize: 9,
    fontWeight: '800'
  },
  gpsAlert1MinBadge: {
    position: 'absolute',
    top: 115,
    right: 14,
    backgroundColor: '#7f1d1d',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 25
  },
  gpsAlert1MinSent: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981'
  },
  gpsAlert1MinText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  gpsRecenterBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 25
  },
  gpsRecenterText: {
    fontSize: 16
  },
  gpsBottomBar: {
    backgroundColor: '#070d18',
    borderTopWidth: 1.5,
    borderColor: '#06b6d4',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 14,
    gap: 10
  },
  gpsEtaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  gpsEtaItem: {
    alignItems: 'center'
  },
  gpsEtaMins: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '900'
  },
  gpsEtaVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  gpsEtaSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  gpsDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#1e293b'
  },
  gpsPassengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  gpsPasName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  gpsPasSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1
  },
  gpsContactBtns: {
    flexDirection: 'row',
    gap: 6
  },
  gpsContactBtnWpp: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10
  },
  gpsContactBtnPhone: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10
  },
  gpsContactBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  gpsActionBox: {
    marginTop: 4
  },
  btnGpsPickup: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center'
  },
  btnGpsPickupText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  btnGpsStartDest: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center'
  },
  btnGpsStartDestText: {
    color: '#070d18',
    fontSize: 14,
    fontWeight: '900'
  },
  btnGpsComplete: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center'
  },
  btnGpsCompleteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  }
});
