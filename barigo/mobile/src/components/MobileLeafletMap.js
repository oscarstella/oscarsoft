import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Mapa móvil ultra-robusto con Leaflet y OpenStreetMap (Modo Oscuro)
 * No requiere Google Maps API Key y funciona 100% en Android e iOS sin pantalla negra.
 */
export default function MobileLeafletMap({
  origin,
  destination,
  routeCoordinates = [],
  driverLocation,
  nearbyDrivers = [],
  userCoords
}) {
  const webViewRef = useRef(null);

  // Generar HTML autosuficiente con Leaflet 1.9.4
  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #070d18; }
    
    /* Filtro nocturno premium idéntico a BariGo Web */
    .dark-tiles {
      filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7) !important;
    }
    
    .car-marker {
      font-size: 24px;
      text-shadow: 0 0 10px rgba(6, 182, 212, 0.8);
      text-align: center;
      transition: all 0.5s ease-out;
    }
    .user-marker {
      width: 14px;
      height: 14px;
      background: #06b6d4;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 14px #06b6d4;
    }
    .pin-origin {
      font-size: 20px;
      text-shadow: 0 2px 5px rgba(0,0,0,0.7);
    }
    .pin-dest {
      font-size: 20px;
      text-shadow: 0 2px 5px rgba(0,0,0,0.7);
    }
    .leaflet-control-attribution {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([-41.1335, -71.3103], 13);

    // Azulejos OpenStreetMap modo oscuro
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      className: 'dark-tiles',
      maxZoom: 19
    }).addTo(map);

    var routePolyline = null;
    var originMarker = null;
    var destMarker = null;
    var userMarker = null;
    var driverMarker = null;
    var nearbyMarkers = [];

    // Recibir mensajes desde React Native
    window.updateMapData = function(data) {
      if (!data) return;

      // 1. Origen
      if (data.origin) {
        if (!originMarker) {
          var originIcon = L.divIcon({
            className: 'pin-origin',
            html: '📍',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
          });
          originMarker = L.marker([data.origin.lat, data.origin.lng], { icon: originIcon }).addTo(map);
        } else {
          originMarker.setLatLng([data.origin.lat, data.origin.lng]);
        }
      }

      // 2. Destino
      if (data.destination) {
        if (!destMarker) {
          var destIcon = L.divIcon({
            className: 'pin-dest',
            html: '🏁',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
          });
          destMarker = L.marker([data.destination.lat, data.destination.lng], { icon: destIcon }).addTo(map);
        } else {
          destMarker.setLatLng([data.destination.lat, data.destination.lng]);
        }
      }

      // 3. Trazado de Ruta calle por calle
      if (data.routeCoordinates && data.routeCoordinates.length > 0) {
        if (routePolyline) {
          map.removeLayer(routePolyline);
        }
        routePolyline = L.polyline(data.routeCoordinates, {
          color: '#06b6d4',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(map);

        map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
      }

      // 4. Chofer en viaje activo
      if (data.driverLocation) {
        if (!driverMarker) {
          var carIcon = L.divIcon({
            className: 'car-marker',
            html: '🚗',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          driverMarker = L.marker([data.driverLocation.lat, data.driverLocation.lng], { icon: carIcon }).addTo(map);
        } else {
          driverMarker.setLatLng([data.driverLocation.lat, data.driverLocation.lng]);
        }
      }

      // 5. Choferes cercanos en Bariloche
      if (data.nearbyDrivers && data.nearbyDrivers.length > 0 && !data.driverLocation) {
        nearbyMarkers.forEach(function(m) { map.removeLayer(m); });
        nearbyMarkers = [];

        data.nearbyDrivers.forEach(function(d) {
          var cIcon = L.divIcon({
            className: 'car-marker',
            html: '🚗',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          var m = L.marker([d.lat, d.lng], { icon: cIcon }).addTo(map);
          nearbyMarkers.push(m);
        });
      }

      // 6. Posición GPS del usuario
      if (data.userCoords) {
        if (!userMarker) {
          var uIcon = L.divIcon({
            className: 'user-marker',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          userMarker = L.marker([data.userCoords.latitude, data.userCoords.longitude], { icon: uIcon }).addTo(map);
        } else {
          userMarker.setLatLng([data.userCoords.latitude, data.userCoords.longitude]);
        }
      }
    };

    // Funciones globales para botones
    window.centerOnUser = function(lat, lng) {
      if (lat && lng) {
        map.flyTo([lat, lng], 15, { duration: 1.2 });
      }
    };

    window.centerOnBariloche = function() {
      map.flyTo([-41.1335, -71.3103], 13.5, { duration: 1.2 });
    };
  </script>
</body>
</html>
  `;

  // Actualizar datos del mapa cuando cambien las props
  useEffect(() => {
    if (webViewRef.current) {
      const payload = JSON.stringify({
        origin,
        destination,
        routeCoordinates,
        driverLocation,
        nearbyDrivers,
        userCoords
      });
      webViewRef.current.injectJavaScript(`
        if (window.updateMapData) {
          window.updateMapData(${payload});
        }
        true;
      `);
    }
  }, [origin, destination, routeCoordinates, driverLocation, nearbyDrivers, userCoords]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        overScrollMode="never"
        onLoadEnd={() => {
          // Inyectar datos iniciales al cargar
          const payload = JSON.stringify({
            origin,
            destination,
            routeCoordinates,
            driverLocation,
            nearbyDrivers,
            userCoords
          });
          webViewRef.current?.injectJavaScript(`
            if (window.updateMapData) {
              window.updateMapData(${payload});
            }
            true;
          `);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d18'
  },
  webview: {
    flex: 1,
    backgroundColor: '#070d18'
  }
});
