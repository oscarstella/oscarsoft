import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  PanResponder
} from 'react-native';
import * as Location from 'expo-location';
import MobileLeafletMap from '../components/MobileLeafletMap';
import { VoiceService } from '../services/voiceService';
import SocketService from '../services/socketService';
import { getBarilocheWeather } from '../services/weatherService';
import { 
  BARILOCHE_POIS, 
  getStreetRoute, 
  searchBarilocheAddress 
} from '../services/routingService';

// Categorías de vehículos reales para Bariloche
const CATEGORIES = [
  { id: 'clasico', name: 'Clásico', icon: '🚗', multiplier: 1.0, desc: 'Auto estándar 4 pas.', eta: 3 },
  { id: 'nieve_4x4', name: 'Nieve 4x4', icon: '🚙', multiplier: 1.35, desc: 'Cadenas / Tracción 4x4', eta: 5 },
  { id: 'premium', name: 'Premium', icon: '✨', multiplier: 1.55, desc: 'Confort ejecutivo', eta: 4 }
];

// Destinos frecuentes rápidos en Bariloche
const QUICK_PRESETS = [
  { title: 'Melipal Km 4', lat: -41.1275, lng: -71.3590, icon: '🌲', subtitle: 'Av. Bustillo Km 4' },
  { title: 'Pasaje Gutiérrez 980', lat: -41.1415571, lng: -71.3132086, icon: '📍', subtitle: 'Sanatorio San Carlos / Belgrano' },
  { title: 'Hospital Zonal Ramón Carrillo', lat: -41.1378, lng: -71.3032, icon: '🏥', subtitle: 'Moreno 601' },
  { title: 'Sanatorio San Carlos (Bustillo)', lat: -41.1312, lng: -71.3268, icon: '🏥', subtitle: 'Av. Bustillo Km 1' },
  { title: 'Sede Central INVAP', lat: -41.1245, lng: -71.2410, icon: '🏭', subtitle: 'Comandante Piedrabuena 4950' },
  { title: 'Chocolates Rapanui', lat: -41.1337, lng: -71.3075, icon: '🍫', subtitle: 'Mitre 202' },
  { title: 'Base Cerro Catedral', lat: -41.1680, lng: -71.4390, icon: '🏔️', subtitle: 'Circuito de Invierno' },
  { title: 'Aeropuerto BRC', lat: -41.1510, lng: -71.1580, icon: '✈️', subtitle: 'Ruta 40 Norte' }
];

// Choferes activos iniciales en el radar de Bariloche
const INITIAL_DRIVERS = [
  { id: 'drv-1', name: 'Carlos Nahuel Huapi', car: 'Chevrolet Onix Blanco', plate: 'AF 342 BZ', lat: -41.1340, lng: -71.3180 },
  { id: 'drv-2', name: 'Esteban Melipal', car: 'Toyota Hilux 4x4 Gris', plate: 'AG 881 KP', lat: -41.1280, lng: -71.3520 },
  { id: 'drv-3', name: 'Mariana Pioneros', car: 'Ford Focus Azul', plate: 'AD 104 LZ', lat: -41.1390, lng: -71.2980 }
];

export default function PassengerScreen() {
  // Coordenadas GPS del usuario
  const [userCoords, setUserCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [hasRealGps, setHasRealGps] = useState(false);

  // Origen y Destino actuales
  const [originText, setOriginText] = useState('Obteniendo ubicación GPS...');
  const [originCoord, setOriginCoord] = useState({ lat: -41.1335, lng: -71.3103 }); // Centro Cívico fallback
  const [destText, setDestText] = useState('Pasaje Gutiérrez 980');
  const [destCoord, setDestCoord] = useState({ lat: -41.1415571, lng: -71.3132086 });

  // Trazado calle por calle (OSRM)
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(2.3);
  const [routeDurationMin, setRouteDurationMin] = useState(6);

  // Modal interactivo de búsqueda de direcciones
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTarget, setSearchTarget] = useState('dest'); // 'origin' | 'dest'
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [confirmedNotice, setConfirmedNotice] = useState(null);

  // Categoría de Vehículo y Medio de Pago
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  // Estados del Viaje y Mapa Interactivo
  const [rideState, setRideState] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [driverRealPos, setDriverRealPos] = useState(null);

  // Alerta de arribo a 1 minuto y respuesta automática del chofer
  const [oneMinuteAlert, setOneMinuteAlert] = useState(null);
  const [driverAutoMessage, setDriverAutoMessage] = useState(null);

  // Gesto de Arrastre para Ampliar o Reducir el Mapa
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 35) {
          setIsMapExpanded(true); // Deslizó hacia abajo -> expande el mapa
        } else if (gestureState.dy < -35) {
          setIsMapExpanded(false); // Deslizó hacia arriba -> expande el panel de datos
        }
      }
    })
  ).current;

  // Cargar Clima de Bariloche y Cálculo de Demora Vial
  useEffect(() => {
    getBarilocheWeather().then(data => {
      if (data) setWeatherInfo(data);
    });
    const weatherTimer = setInterval(() => {
      getBarilocheWeather().then(data => {
        if (data) setWeatherInfo(data);
      });
    }, 60000);
    return () => clearInterval(weatherTimer);
  }, []);

  // WebSockets en Tiempo Real con Choferes Reales de Bariloche (CERO DEMOS / CERO MOCKS)
  useEffect(() => {
    const socket = SocketService.connect('usr-pasajero-1', 'passenger');
    if (!socket) return;

    const handleRideAccepted = (data) => {
      console.log('[Mobile Pasajero] ¡Chofer Real Aceptó el Viaje!', data);
      const incomingRide = data.ride || {};
      const incomingDriver = data.driver || {};

      const accepted = {
        status: 'accepted',
        id: incomingRide.id || `ride-${Date.now()}`,
        origin: incomingRide.originAddress || originText,
        destination: incomingRide.destinationAddress || destText,
        fare: incomingRide.estimatedFare || incomingRide.fare || totalFare,
        category: selectedCategory.name,
        paymentMethod,
        pin: incomingRide.pin || Math.floor(1000 + Math.random() * 9000).toString(),
        driver: {
          name: incomingDriver.fullName || incomingDriver.name || 'Carlos Nahuel Huapi',
          car: incomingDriver.vehicle || 'Chevrolet Onix Joy Blanco',
          plate: incomingDriver.plate || 'AF 342 BZ',
          rating: incomingDriver.rating || 4.96,
          phone: incomingDriver.phone || '+5492944223344',
          lat: incomingDriver.lat || (originCoord.lat + 0.002),
          lng: incomingDriver.lng || (originCoord.lng - 0.002)
        }
      };

      setRideState(accepted);
      VoiceService.notifyDriverAssigned(
        accepted.driver.name,
        accepted.driver.car,
        accepted.driver.plate
      );

      setTripHistory(prev => [
        {
          id: accepted.id,
          date: 'Hoy (En curso)',
          origin: accepted.origin,
          destination: accepted.destination,
          fare: accepted.fare,
          driver: `${accepted.driver.name} • ${accepted.driver.car}`,
          category: accepted.category,
          paymentMethod: accepted.paymentMethod
        },
        ...prev
      ]);
    };

    const handleDriverLocation = (data) => {
      if (data && data.lat && data.lng) {
        setDriverRealPos({ lat: Number(data.lat), lng: Number(data.lng) });
      }
    };

    const handleStatusChanged = (data) => {
      if (data.status === 'arriving') {
        VoiceService.speak("Tu chofer ha llegado al punto de encuentro.");
        setRideState(prev => prev ? { ...prev, status: 'arriving' } : prev);
      } else if (data.status === 'in_progress') {
        VoiceService.speak(`Viaje en curso hacia tu destino.`);
        setRideState(prev => prev ? { ...prev, status: 'in_progress' } : prev);
      } else if (data.status === 'completed') {
        VoiceService.speak(`Has llegado a tu destino. Total del viaje: ${totalFare} pesos.`);
        setRideState(prev => prev ? { ...prev, status: 'completed' } : prev);
      }
    };

    const handleCancelled = () => {
      setRideState(null);
      setOneMinuteAlert(null);
      setDriverAutoMessage(null);
      VoiceService.speak("El viaje ha sido cancelado.");
    };

    const handleOneMinuteAlert = (data) => {
      setOneMinuteAlert(data);
      setDriverAutoMessage(data?.message || '¡Hola! Estoy a 1 minuto de llegar a tu ubicación. Por favor salí al punto de encuentro.');
      VoiceService.notifyDriverOneMinuteAway();
    };

    socket.on('ride:accepted', handleRideAccepted);
    socket.on('ride:driver_location', handleDriverLocation);
    socket.on('ride:status_changed', handleStatusChanged);
    socket.on('ride:cancelled', handleCancelled);
    socket.on('ride:one_minute_alert', handleOneMinuteAlert);

    return () => {
      socket.off('ride:accepted', handleRideAccepted);
      socket.off('ride:driver_location', handleDriverLocation);
      socket.off('ride:status_changed', handleStatusChanged);
      socket.off('ride:cancelled', handleCancelled);
      socket.off('ride:one_minute_alert', handleOneMinuteAlert);
    };
  }, [originText, destText, totalFare, selectedCategory, paymentMethod, originCoord]);

  // Historial de Viajes
  const [showHistory, setShowHistory] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);

  // 1. OBTENER GEOLOCALIZACIÓN GPS REAL AL ABRIR LA APP
  useEffect(() => {
    handleGetRealGps(true);
  }, []);

  const handleGetRealGps = async (initial = false) => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!initial) Alert.alert('Permiso de GPS', 'Habilitá el permiso de ubicación para localizarte automáticamente en Bariloche.');
        setOriginText('Centro Cívico de Bariloche');
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      
      setUserCoords({ latitude, longitude });
      setOriginCoord({ lat: latitude, lng: longitude });
      setHasRealGps(true);

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, {
          headers: { 'User-Agent': 'BariGo-Mobile/2.0' }
        });
        if (res.ok) {
          const data = await res.json();
          const road = data.address?.road || data.display_name.split(',')[0];
          const number = data.address?.house_number ? ` ${data.address.house_number}` : '';
          const suburb = data.address?.suburb || data.address?.neighbourhood || '';
          const formatted = `${road}${number}${suburb ? ` (${suburb})` : ''}`.trim();
          setOriginText(formatted || 'Mi Ubicación Actual');
        } else {
          setOriginText('Mi Ubicación Actual (GPS)');
        }
      } catch (e) {
        setOriginText('Mi Ubicación Actual (GPS)');
      }
    } catch (e) {
      console.log('Error GPS:', e);
      setOriginText('Centro Cívico Bariloche');
    } finally {
      setIsLocating(false);
    }
  };

  // 2. CALCULAR RUTA CALLE POR CALLE (OSRM) CADA VEZ QUE CAMBIE ORIGEN O DESTINO
  useEffect(() => {
    if (originCoord && destCoord) {
      let isCancelled = false;
      getStreetRoute(originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng).then(res => {
        if (!isCancelled && res) {
          if (res.points && res.points.length > 0) {
            setRouteCoords(res.points);
          }
          if (res.distanceKm) setRouteDistanceKm(res.distanceKm);
          if (res.durationMin) setRouteDurationMin(res.durationMin);
        }
      }).catch(err => console.log('Error ruteo móvil:', err));

      return () => { isCancelled = true; };
    }
  }, [originCoord?.lat, originCoord?.lng, destCoord?.lat, destCoord?.lng]);

  // 3. ABRIR MODAL DE BÚSQUEDA
  const openSearchModal = (target) => {
    setSearchTarget(target);
    const initialText = target === 'origin' ? originText : (destText === 'Pasaje Gutiérrez 980' ? '' : destText);
    setSearchQuery(initialText);
    setSearchModalVisible(true);
    if (initialText.trim().length >= 2) {
      executeAddressSearch(initialText);
    } else {
      setSuggestions([]);
    }
  };

  const executeAddressSearch = async (text) => {
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearchingAddress(true);
    try {
      const results = await searchBarilocheAddress(text);
      setSuggestions(results);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleSearchQueryChange = (text) => {
    setSearchQuery(text);
    executeAddressSearch(text);
  };

  // 4. CONFIRMAR SELECCIÓN DE DIRECCIÓN
  const confirmAddressSelection = (title, lat, lng) => {
    if (searchTarget === 'origin') {
      setOriginText(title);
      setOriginCoord({ lat, lng });
    } else {
      setDestText(title);
      setDestCoord({ lat, lng });
    }
    setSearchModalVisible(false);
    setConfirmedNotice(`✅ Fijado: ${title}`);
    setTimeout(() => setConfirmedNotice(null), 3500);
  };

  // Manejar cuando el usuario toca "Enter / Buscar" en el teclado
  const handleKeyboardSubmit = async () => {
    if (suggestions.length > 0) {
      const first = suggestions[0];
      confirmAddressSelection(first.title, first.lat, first.lng);
      return;
    }
    // Si no había sugerencias abiertas aún, forzar búsqueda inmediata
    if (searchQuery.trim().length >= 2) {
      setSearchingAddress(true);
      const res = await searchBarilocheAddress(searchQuery.trim());
      setSearchingAddress(false);
      if (res.length > 0) {
        confirmAddressSelection(res[0].title, res[0].lat, res[0].lng);
      }
    }
  };

  // 5. CÁLCULO DE TARIFA TRANSPARENTE
  const baseRate = 1200 + (routeDistanceKm * 650) + (routeDurationMin * 120);
  const totalFare = Math.round(Math.max(baseRate * selectedCategory.multiplier, 2500) / 50) * 50;

  // 6. SOLICITAR VIAJE REAL (CERO DEMOS / CERO MOCKS)
  const handleRequestRide = () => {
    VoiceService.speak("Buscando choferes disponibles en Bariloche.");
    const rideId = `ride-${Date.now()}`;

    setRideState({
      id: rideId,
      status: 'searching',
      fare: totalFare,
      origin: originText,
      destination: destText,
      category: selectedCategory.name,
      paymentMethod
    });

    const ridePayload = {
      id: rideId,
      passengerId: 'usr-pasajero-1',
      passengerName: 'Oscar Nicolás Stella',
      passengerPhone: '+5492944001122',
      originAddress: originText,
      originLat: originCoord.lat,
      originLng: originCoord.lng,
      destinationAddress: destText,
      destinationLat: destCoord.lat,
      destinationLng: destCoord.lng,
      fare: totalFare,
      estimatedFare: totalFare,
      distanceKm: routeDistanceKm,
      durationMins: routeDurationMin,
      category: selectedCategory.name,
      paymentMethod
    };

    // Emitir inmediatamente al servidor WebSocket de Bariloche
    SocketService.requestRide(ridePayload);

    // Enviar también al endpoint REST del backend
    fetch('https://oscarsoft.com.ar/api/barigo/rides/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ridePayload)
    }).catch(err => console.log('[REST Request]:', err.message));
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancelar Viaje',
      '¿Deseas cancelar la solicitud del viaje?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive', 
          onPress: () => {
            if (rideState?.id) {
              SocketService.cancelRide(rideState.id);
            }
            setRideState(null);
            VoiceService.speak("Viaje cancelado.");
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 🗺️ MAPA LEAFLET OSCURO EN VIVO */}
      <View style={[styles.mapContainer, isMapExpanded && styles.mapContainerExpanded]}>
        <MobileLeafletMap
          origin={originCoord}
          destination={destCoord}
          routeCoordinates={routeCoords}
          driverLocation={driverRealPos || (rideState?.driver ? rideState.driver : null)}
          nearbyDrivers={INITIAL_DRIVERS}
          userCoords={userCoords}
        />

        {/* Barra superior de estado de ruta calle por calle */}
        <View style={styles.routeHeaderPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.routePillText}>
            Ruta: {routeDistanceKm} km • ~{routeDurationMin + (weatherInfo?.delayMin || 0)} min
          </Text>
        </View>

        {/* Alerta Automática de Chofer a 1 Minuto */}
        {oneMinuteAlert && (
          <View style={styles.oneMinBanner}>
            <View style={styles.oneMinBannerHead}>
              <Text style={styles.oneMinBannerTitle}>🚨 ¡TU AUTO ESTÁ A 1 MINUTO!</Text>
              <TouchableOpacity onPress={() => setOneMinuteAlert(null)}>
                <Text style={styles.oneMinBannerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.oneMinBannerSub}>{oneMinuteAlert.message || 'El chofer está a pocos metros de tu ubicación. Salí al punto de encuentro.'}</Text>
          </View>
        )}

        {/* Widget Clima y Demora de Tráfico Bariloche (Open-Meteo API) */}
        <View style={styles.weatherFloatBadge}>
          <Text style={styles.weatherBadgeMain}>
            {weatherInfo?.icon || '⛅'} {weatherInfo?.temperature ?? 11}°C
          </Text>
          <Text style={styles.weatherBadgeSub}>
            {weatherInfo?.delayText || 'Tráfico fluido'}
          </Text>
        </View>

        {/* Botón flotante para Alternar Tamaño del Mapa (Arrastrar o Tocar) */}
        <TouchableOpacity 
          style={styles.expandMapFloatBtn}
          onPress={() => setIsMapExpanded(!isMapExpanded)}
          activeOpacity={0.8}
        >
          <Text style={styles.expandMapFloatText}>
            {isMapExpanded ? '📄 Ver Formulario' : '🗺️ Ampliar Mapa'}
          </Text>
        </TouchableOpacity>

        {/* Notificación flotante de confirmación de dirección */}
        {confirmedNotice && (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>{confirmedNotice}</Text>
          </View>
        )}

        {/* Botón flotante para ver historial */}
        <TouchableOpacity 
          style={styles.historyFloatBtn} 
          onPress={() => setShowHistory(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.historyFloatText}>📜 Mis Viajes</Text>
        </TouchableOpacity>
      </View>

      {/* 📄 PANEL INFERIOR DE PASAJERO CON ARRASTRE DINÁMICO */}
      <View style={[styles.sheetContainer, isMapExpanded && styles.sheetContainerCollapsed]}>
        {showHistory ? (
          // --- VISTA: HISTORIAL DE VIAJES ---
          <View style={styles.historyView}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>📜 Mis Viajes en Bariloche</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Cerrar ✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {tripHistory.map(item => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyFare}>${item.fare.toLocaleString('es-AR')}</Text>
                  </View>
                  <Text style={styles.historyPoint}>📍 {item.origin}</Text>
                  <Text style={styles.historyPoint}>🏁 {item.destination}</Text>
                  <View style={styles.historyBottom}>
                    <Text style={styles.historyDriver}>{item.driver} • {item.paymentMethod}</Text>
                    <TouchableOpacity 
                      style={styles.repeatBtn}
                      onPress={() => {
                        setOriginText(item.origin);
                        setDestText(item.destination);
                        setShowHistory(false);
                      }}
                    >
                      <Text style={styles.repeatBtnText}>Repetir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : rideState?.status === 'searching' ? (
          // --- VISTA: RADAR BUSCANDO CHOFER ---
          <View style={styles.searchingBox}>
            <View style={styles.radarIconBox}>
              <ActivityIndicator size="large" color="#06b6d4" />
            </View>
            <Text style={styles.searchingTitle}>Buscando choferes cercanos...</Text>
            <Text style={styles.searchingSub}>
              Conectando por radar con conductores verificados en Bariloche sin comisión a terceros.
            </Text>
            <View style={styles.searchingMeta}>
              <Text style={styles.metaFare}>Tarifa fija: ${rideState.fare.toLocaleString('es-AR')}</Text>
            </View>
            <TouchableOpacity style={styles.btnCancelRide} onPress={handleCancelRide}>
              <Text style={styles.btnCancelText}>Cancelar Solicitud</Text>
            </TouchableOpacity>
          </View>
        ) : rideState?.status === 'accepted' ? (
          // --- VISTA: CHOFER EN CAMINO ---
          <ScrollView contentContainerStyle={styles.activeRideBox}>
            <View style={styles.driverCard}>
              <View style={styles.driverHead}>
                <View>
                  <Text style={styles.driverTag}>● CHOFER EN CAMINO</Text>
                  <Text style={styles.driverName}>{rideState.driver.name}</Text>
                  <Text style={styles.driverCar}>{rideState.driver.car}</Text>
                </View>
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{rideState.driver.plate}</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <Text style={styles.badgeChip}>⭐ {rideState.driver.rating}</Text>
                <Text style={styles.badgeChip}>⏱️ Arribo en ~3 min</Text>
                <Text style={styles.badgeChip}>PIN: {rideState.pin}</Text>
              </View>

              {/* Mensaje Automático del Chofer a 1 Minuto */}
              {driverAutoMessage && (
                <View style={styles.autoMsgBox}>
                  <Text style={styles.autoMsgTag}>🚗 RESPUESTA AUTOMÁTICA DEL CHOFER:</Text>
                  <Text style={styles.autoMsgText}>"{driverAutoMessage}"</Text>
                </View>
              )}

              <View style={styles.routeSummaryRow}>
                <Text style={styles.summaryLine} numberOfLines={1}>📍 {rideState.origin}</Text>
                <Text style={styles.summaryLine} numberOfLines={1}>🏁 {rideState.destination}</Text>
              </View>

              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Total a pagar ({rideState.paymentMethod}):</Text>
                <Text style={styles.fareValue}>${rideState.fare.toLocaleString('es-AR')}</Text>
              </View>

              <View style={styles.driverActions}>
                <TouchableOpacity 
                  style={[styles.btnDriverAction, { backgroundColor: '#10b981' }]}
                  onPress={() => Linking.openURL(`https://wa.me/${rideState.driver.phone.replace('+', '')}`)}
                >
                  <Text style={styles.btnDriverText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btnDriverAction, { backgroundColor: '#0284c7' }]}
                  onPress={() => Linking.openURL(`tel:${rideState.driver.phone}`)}
                >
                  <Text style={styles.btnDriverText}>Llamar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btnDriverAction, { backgroundColor: '#ef4444' }]}
                  onPress={handleCancelRide}
                >
                  <Text style={styles.btnDriverText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : isMapExpanded ? (
          // --- VISTA: BARRA COLAPSADA PARA MAPA AMPLIO (85% PANTALLA) ---
          <TouchableOpacity 
            style={styles.sheetCollapsedBar}
            onPress={() => setIsMapExpanded(false)}
            activeOpacity={0.85}
          >
            <View style={styles.sheetDragPill} />
            <View style={styles.sheetCollapsedRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.collapsedTitle} numberOfLines={1}>
                  📍 {originText.split(',')[0]} ➔ 🏁 {destText.split(',')[0]}
                </Text>
                <Text style={styles.collapsedSub}>
                  ${totalFare.toLocaleString('es-AR')} ARS • {selectedCategory.name} • Toca para abrir datos
                </Text>
              </View>
              <View style={styles.btnExpandSheet}>
                <Text style={styles.btnExpandSheetText}>Ver Datos ↑</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          // --- VISTA: FORMULARIO PRINCIPAL DE PASAJERO CON ARRASTRE ---
          <View style={{ flex: 1 }}>
            {/* Tirador de arrastre táctil para ampliar/reducir mapa */}
            <View {...panResponder.panHandlers} style={styles.sheetHandleArea}>
              <TouchableOpacity 
                style={styles.sheetHandleTouch} 
                onPress={() => setIsMapExpanded(true)}
                activeOpacity={0.7}
              >
                <View style={styles.sheetDragPill} />
                <Text style={styles.sheetDragHint}>Deslizar abajo o tocar para Ampliar Mapa 🗺️</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {/* 1. TARJETA DE DIRECCIONES (PUNTO DE PARTIDA Y DESTINO) */}
              <View style={styles.addressesCard}>
                {/* ORIGEN */}
                <TouchableOpacity 
                  style={styles.inputCardRow} 
                  onPress={() => openSearchModal('origin')}
                  activeOpacity={0.8}
                >
                  <View style={styles.dotOrigin} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Punto de partida (Recogida)</Text>
                    <Text style={styles.addressDisplayText} numberOfLines={1}>
                      {originText}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.gpsIconBtn} 
                    onPress={() => handleGetRealGps(false)}
                    title="Localizar por GPS"
                  >
                    <Text style={{ fontSize: 16 }}>{isLocating ? '⏳' : '⌖'}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                <View style={styles.inputDivider} />

                {/* DESTINO */}
                <TouchableOpacity 
                  style={styles.inputCardRow} 
                  onPress={() => openSearchModal('dest')}
                  activeOpacity={0.8}
                >
                  <View style={styles.pinDest} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.fieldLabel}>Destino en Bariloche</Text>
                      <Text style={styles.tapToEditHint}>• Tocar para cambiar</Text>
                    </View>
                    <Text style={styles.addressDisplayText} numberOfLines={1}>
                      {destText}
                    </Text>
                  </View>
                  <View style={styles.searchArrowBtn}>
                    <Text style={{ color: '#06b6d4', fontSize: 14, fontWeight: 'bold' }}>Buscar 🔍</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 2. ACCESOS DIRECTOS A DESTINOS FRECUENTES */}
              <View style={styles.presetsSection}>
                <Text style={styles.sectionHeader}>Destinos frecuentes con altura exacta:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                  {QUICK_PRESETS.map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.presetChip, destText === p.title && styles.presetChipActive]}
                      onPress={() => {
                        setDestText(p.title);
                        setDestCoord({ lat: p.lat, lng: p.lng });
                        setConfirmedNotice(`✅ Destino fijado: ${p.title}`);
                        setTimeout(() => setConfirmedNotice(null), 3000);
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{p.icon}</Text>
                      <View>
                        <Text style={[styles.presetText, destText === p.title && { color: '#06b6d4' }]}>
                          {p.title}
                        </Text>
                        {p.subtitle && (
                          <Text style={{ fontSize: 9, color: '#64748b' }}>{p.subtitle}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 3. SELECTOR DE CATEGORÍA DE VEHÍCULO */}
              <Text style={styles.sectionHeader}>Vehículos disponibles:</Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map(cat => {
                  const fare = Math.round(Math.max(baseRate * cat.multiplier, 2500) / 50) * 50;
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <Text style={styles.categoryEta}>~{cat.eta} min</Text>
                      <Text style={styles.categoryPrice}>${fare.toLocaleString('es-AR')}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. MEDIO DE PAGO Y BOTÓN DE CONFIRMACIÓN */}
              <View style={styles.bottomBar}>
                <View style={styles.paymentToggle}>
                  {['Efectivo', 'Mercado Pago'].map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.payOptionBtn, paymentMethod === method && styles.payOptionBtnActive]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text style={[styles.payOptionText, paymentMethod === method && styles.payOptionTextActive]}>
                        {method === 'Efectivo' ? '💵 Efectivo' : '💳 Mercado Pago'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.btnConfirmRide}
                  onPress={handleRequestRide}
                  activeOpacity={0.8}
                >
                  <View style={styles.confirmContent}>
                    <Text style={styles.btnConfirmTitle}>Solicitar {selectedCategory.name}</Text>
                    <Text style={styles.btnConfirmFare}>${totalFare.toLocaleString('es-AR')} ARS</Text>
                  </View>
                  <Text style={styles.btnConfirmArrow}>➔</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* 🔍 MODAL PANTALLA COMPLETA DE BÚSQUEDA Y CONFIRMACIÓN DE CALLE Y NÚMERO */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.searchModalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header del Modal */}
          <View style={styles.searchModalHeader}>
            <TouchableOpacity 
              style={styles.btnBackModal}
              onPress={() => setSearchModalVisible(false)}
            >
              <Text style={styles.btnBackText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.searchModalTitle}>
              {searchTarget === 'origin' ? 'Punto de Recogida' : 'Buscar Destino'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Barra de Búsqueda con Botón Buscar */}
          <View style={styles.searchBarBox}>
            <Text style={styles.searchIconSymbol}>🔍</Text>
            <TextInput
              style={styles.searchTextInput}
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              onSubmitEditing={handleKeyboardSubmit}
              placeholder="Calle y altura (Ej: Pasaje Gutiérrez 980)"
              placeholderTextColor="#64748b"
              autoFocus={true}
              returnKeyType="search"
              selectTextOnFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchQueryChange('')} style={{ padding: 6 }}>
                <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.btnExecuteSearch} 
              onPress={handleKeyboardSubmit}
            >
              <Text style={styles.btnExecuteText}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {searchingAddress && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#06b6d4" />
              <Text style={styles.loadingText}>Buscando en mapa de Bariloche...</Text>
            </View>
          )}

          {/* Lista de Resultados de Calle, Número y POIs */}
          <ScrollView 
            style={styles.searchResultsList} 
            keyboardShouldPersistTaps="always"
          >
            {suggestions.length > 0 ? (
              suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchCardItem}
                  onPress={() => confirmAddressSelection(item.title, item.lat, item.lng)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardItemIcon}>{item.icon || '📍'}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.cardItemTitle}>{item.title}</Text>
                      {item.tag && (
                        <Text style={styles.cardItemBadge}>{item.tag}</Text>
                      )}
                    </View>
                    <Text style={styles.cardItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.btnSelectBadge}>
                    <Text style={styles.btnSelectText}>Elegir ✓</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : searchQuery.length >= 2 && !searchingAddress ? (
              <View style={styles.emptyResultsBox}>
                <Text style={styles.emptyText}>¿No ves la altura exacta?</Text>
                <TouchableOpacity 
                  style={styles.btnForceSelect}
                  onPress={() => {
                    // Calcular aproximación para Bariloche
                    confirmAddressSelection(searchQuery.trim(), -41.1370, -71.3110);
                  }}
                >
                  <Text style={styles.btnForceText}>Fijar "{searchQuery}" en Bariloche ➔</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quickSuggestionsSection}>
                <Text style={styles.quickSuggTitle}>Lugares y direcciones reconocidas:</Text>
                {QUICK_PRESETS.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickSuggItem}
                    onPress={() => confirmAddressSelection(p.title, p.lat, p.lng)}
                  >
                    <Text style={{ fontSize: 18 }}>{p.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quickSuggName}>{p.title}</Text>
                      <Text style={styles.quickSuggSub}>{p.subtitle}</Text>
                    </View>
                    <Text style={{ color: '#06b6d4', fontSize: 13, fontWeight: '700' }}>Elegir ➔</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d18'
  },
  mapContainer: {
    flex: 1.1,
    position: 'relative'
  },
  mapContainerExpanded: {
    flex: 1
  },
  weatherFloatBadge: {
    position: 'absolute',
    top: 54,
    left: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    zIndex: 20
  },
  weatherBadgeMain: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800'
  },
  weatherBadgeSub: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600'
  },
  expandMapFloatBtn: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)',
    zIndex: 20
  },
  expandMapFloatText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700'
  },
  routeHeaderPill: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06b6d4'
  },
  routePillText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700'
  },
  noticeBanner: {
    position: 'absolute',
    top: 92,
    left: 14,
    right: 14,
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 25,
    alignItems: 'center'
  },
  noticeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  historyFloatBtn: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 20
  },
  historyFloatText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '700'
  },
  sheetContainer: {
    flex: 1.3,
    backgroundColor: '#0a101d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingTop: 8
  },
  sheetContainerCollapsed: {
    flex: 0,
    height: 82,
    paddingTop: 6
  },
  sheetHandleArea: {
    alignItems: 'center',
    paddingBottom: 6
  },
  sheetHandleTouch: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 2
  },
  sheetDragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#334155',
    marginBottom: 4
  },
  sheetDragHint: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700'
  },
  sheetCollapsedBar: {
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  sheetCollapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  collapsedTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700'
  },
  collapsedSub: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  btnExpandSheet: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  btnExpandSheetText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  formScroll: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  addressesCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12
  },
  inputCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4
  },
  dotOrigin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#06b6d4'
  },
  pinDest: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#fbbf24'
  },
  fieldLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tapToEditHint: {
    color: '#06b6d4',
    fontSize: 9,
    fontWeight: '700'
  },
  addressDisplayText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
    marginLeft: 20
  },
  gpsIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b'
  },
  searchArrowBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  presetsSection: {
    marginBottom: 12
  },
  sectionHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8
  },
  presetsScroll: {
    flexDirection: 'row'
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 8
  },
  presetChipActive: {
    borderColor: '#06b6d4',
    backgroundColor: '#13233c'
  },
  presetText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600'
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  categoryCardSelected: {
    borderColor: '#06b6d4',
    backgroundColor: '#13233c'
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 4
  },
  categoryName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700'
  },
  categoryEta: {
    color: '#64748b',
    fontSize: 10,
    marginVertical: 2
  },
  categoryPrice: {
    color: '#06b6d4',
    fontSize: 13,
    fontWeight: '800'
  },
  bottomBar: {
    gap: 10
  },
  paymentToggle: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  payOptionBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10
  },
  payOptionBtnActive: {
    backgroundColor: '#1e293b'
  },
  payOptionText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  payOptionTextActive: {
    color: '#f8fafc',
    fontWeight: '700'
  },
  btnConfirmRide: {
    backgroundColor: '#06b6d4',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  confirmContent: {
    flexDirection: 'column'
  },
  btnConfirmTitle: {
    color: '#070d18',
    fontSize: 15,
    fontWeight: '800'
  },
  btnConfirmFare: {
    color: '#070d18',
    fontSize: 13,
    fontWeight: '700'
  },
  btnConfirmArrow: {
    color: '#070d18',
    fontSize: 18,
    fontWeight: '900'
  },
  // --- RADAR STYLES ---
  searchingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radarIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#06b6d4'
  },
  searchingTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6
  },
  searchingSub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14
  },
  searchingMeta: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16
  },
  metaFare: {
    color: '#06b6d4',
    fontWeight: '700',
    fontSize: 14
  },
  btnCancelRide: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1e293b'
  },
  btnCancelText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700'
  },
  // --- DRIVER CARD STYLES ---
  activeRideBox: {
    padding: 16
  },
  driverCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  driverHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  driverTag: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  driverName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800'
  },
  driverCar: {
    color: '#94a3b8',
    fontSize: 12
  },
  plateBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  plateText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  badgeChip: {
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  routeSummaryRow: {
    backgroundColor: '#070d18',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12
  },
  summaryLine: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600'
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#1e293b'
  },
  fareLabel: {
    color: '#94a3b8',
    fontSize: 12
  },
  fareValue: {
    color: '#06b6d4',
    fontSize: 16,
    fontWeight: '800'
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8
  },
  btnDriverAction: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12
  },
  btnDriverText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  // --- HISTORY VIEW STYLES ---
  historyView: {
    flex: 1,
    paddingHorizontal: 16
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  historyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800'
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700'
  },
  historyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  historyDate: {
    color: '#64748b',
    fontSize: 11
  },
  historyFare: {
    color: '#06b6d4',
    fontSize: 13,
    fontWeight: '800'
  },
  historyPoint: {
    color: '#f1f5f9',
    fontSize: 12,
    marginVertical: 2
  },
  historyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#1e293b'
  },
  historyDriver: {
    color: '#94a3b8',
    fontSize: 10
  },
  repeatBtn: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  repeatBtnText: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: '700'
  },
  // --- SEARCH MODAL STYLES ---
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#070d18',
    paddingTop: Platform.OS === 'ios' ? 44 : 20
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  btnBackModal: {
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  btnBackText: {
    color: '#06b6d4',
    fontSize: 14,
    fontWeight: '700'
  },
  searchModalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800'
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#06b6d4'
  },
  searchIconSymbol: {
    fontSize: 16,
    marginRight: 8
  },
  searchTextInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 12
  },
  btnExecuteSearch: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 6
  },
  btnExecuteText: {
    color: '#070d18',
    fontWeight: '800',
    fontSize: 12
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10
  },
  loadingText: {
    color: '#06b6d4',
    fontSize: 12
  },
  searchResultsList: {
    flex: 1,
    paddingHorizontal: 16
  },
  searchCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12
  },
  cardItemIcon: {
    fontSize: 22
  },
  cardItemTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700'
  },
  cardItemBadge: {
    fontSize: 9,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    color: '#06b6d4',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700'
  },
  cardItemSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2
  },
  btnSelectBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  btnSelectText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyResultsBox: {
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12
  },
  btnForceSelect: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  btnForceText: {
    color: '#06b6d4',
    fontSize: 13,
    fontWeight: '700'
  },
  quickSuggestionsSection: {
    paddingTop: 8
  },
  quickSuggTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  quickSuggItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12
  },
  quickSuggName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  quickSuggSub: {
    color: '#64748b',
    fontSize: 11
  },
  // Alerta 1 Minuto y Mensaje Automático
  oneMinBanner: {
    position: 'absolute',
    top: 50,
    left: 14,
    right: 14,
    backgroundColor: '#991b1b',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 16,
    padding: 12,
    zIndex: 50,
    elevation: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10
  },
  oneMinBannerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  oneMinBannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  oneMinBannerClose: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    padding: 2
  },
  oneMinBannerSub: {
    color: '#fecaca',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15
  },
  autoMsgBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 10,
    marginVertical: 10
  },
  autoMsgTag: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.4
  },
  autoMsgText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic'
  }
});
