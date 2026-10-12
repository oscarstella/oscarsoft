// Servicio GPS real con Geolocation API nativa del navegador y Geocodificación Nominatim
import { BARILOCHE_CENTER, BARILOCHE_STREET_DIRECTORY, BARILOCHE_PRESETS } from '../constants/barilocheData';

class GpsService {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
  }

  // Obtener ubicación GPS real del dispositivo / navegador
  async getCurrentPosition() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        console.warn('[GPS] Geolocation no soportado en este navegador');
        resolve({ ...BARILOCHE_CENTER, accuracy: 100, isRealGps: false });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
            isRealGps: true
          };
          this.currentPosition = coords;
          resolve(coords);
        },
        (error) => {
          console.warn('[GPS] Permiso denegado o error de geolocalización:', error.message);
          // Fallback al Centro Cívico de Bariloche
          resolve({
            lat: BARILOCHE_CENTER.lat,
            lng: BARILOCHE_CENTER.lng,
            accuracy: 50,
            isRealGps: false,
            error: error.message
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  }

  // Seguimiento GPS continuo en tiempo real (para Chofer)
  startTracking(onUpdate, onError) {
    if (this.watchId !== null) {
      this.stopTracking();
    }

    if (typeof window === 'undefined' || !navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading || 0,
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0, // km/h
          timestamp: pos.timestamp,
          isRealGps: true
        };
        this.currentPosition = coords;
        if (onUpdate) onUpdate(coords);
      },
      (err) => {
        console.warn('[GPS Tracking] Error:', err.message);
        if (onError) onError(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 12000
      }
    );
  }

  stopTracking() {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Geocodificación inversa real: de Coordenadas Lat/Lng a Nombre de Calle
  async reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BariGo-Mobility-App/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const road = data.address.road || data.address.pedestrian || data.address.suburb || data.address.neighbourhood;
          const houseNumber = data.address.house_number ? ` ${data.address.house_number}` : '';
          const city = data.address.city || data.address.town || 'San Carlos de Bariloche';
          
          if (road) {
            return `${road}${houseNumber}, ${city}`;
          }
          if (data.display_name) {
            return data.display_name.split(',').slice(0, 3).join(',');
          }
        }
      }
    } catch (e) {
      // Fallback a matching local si la red falla
    }

    // Fallback: calcular calle más cercana del directorio de Bariloche
    return this.findClosestBarilocheStreet(lat, lng);
  }

  findClosestBarilocheStreet(lat, lng) {
    let minDistance = Infinity;
    let closestName = 'San Carlos de Bariloche';

    for (const street of BARILOCHE_STREET_DIRECTORY) {
      const dLat = (street.lat - lat) * 111;
      const dLng = (street.lng - lng) * 85;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestName = `${street.name}, ${street.zone}`;
      }
    }

    for (const preset of BARILOCHE_PRESETS) {
      const dLat = (preset.location.lat - lat) * 111;
      const dLng = (preset.location.lng - lng) * 85;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestName = `${preset.title}, ${preset.address}`;
      }
    }

    return closestName;
  }
}

export const gpsService = new GpsService();
