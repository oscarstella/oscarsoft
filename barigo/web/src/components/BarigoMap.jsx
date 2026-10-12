import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus, Crosshair } from 'lucide-react';
import { BARILOCHE_CENTER } from '../constants/barilocheData';

// Fix icons default leaflet issue
delete L.Icon.Default.prototype._getIconUrl;

export default function BarigoMap({
  pickup,
  dropoff,
  pickupLabel = 'Origen',
  dropoffLabel = 'Destino',
  hidePickupMarker = false,
  drivers = [],
  assignedDriver,
  assignedDriverLoc,
  routePolyline = [],
  onMapClick,
  center = BARILOCHE_CENTER,
  zoom = 14,
  interactive = true,
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  // Inicializar Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive
      });

      // Capa de Mapa OpenStreetMap Dark nativo (sin requerir API key ni marcas de agua)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        className: 'dark-tiles'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      // Evento de clic en el mapa para seleccionar puntos
      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      // Invalidate size para garantizar renderizado perfecto
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Actualizar marcadores y polylines dinámicamente
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !routeLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    // 1. Choferes Cercanos (si no hay chofer asignado)
    if (!assignedDriver && drivers.length > 0) {
      drivers.forEach(driver => {
        if (driver.status === 'offline') return;

        const carHtml = `
          <div class="leaflet-driver-marker ${driver.status}">
            <div class="driver-pulse"></div>
            <div class="driver-car-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div class="driver-tag">${driver.vehiclePlate || 'BariGo'}</div>
          </div>
        `;

        const icon = L.divIcon({
          html: carHtml,
          className: 'custom-driver-div-icon',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        L.marker([driver.lat, driver.lng], { icon })
          .bindPopup(`<b>${driver.name}</b><br/>${driver.vehicleModel}<br/>⭐ ${driver.rating}`)
          .addTo(markersLayerRef.current);
      });
    }

    // 2. Chofer Asignado (Con halo verde y seguimiento en vivo)
    if (assignedDriver && assignedDriverLoc) {
      const assignedHtml = `
        <div class="leaflet-driver-marker assigned">
          <div class="driver-pulse-green"></div>
          <div class="driver-car-icon assigned">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="driver-tag assigned">${assignedDriver.name?.split(' ')[0]} • ${assignedDriver.vehiclePlate || ''}</div>
        </div>
      `;

      const assignedIcon = L.divIcon({
        html: assignedHtml,
        className: 'custom-driver-div-icon',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
      });

      L.marker([assignedDriverLoc.lat, assignedDriverLoc.lng], { icon: assignedIcon })
        .addTo(markersLayerRef.current);
    }

    // 3. Marcador de Origen (Beacon Cyan)
    if (pickup && !hidePickupMarker) {
      const pickupHtml = `
        <div class="leaflet-pickup-marker">
          <div class="pickup-ring"></div>
          <div class="pickup-core"></div>
          <div class="pickup-label">${pickupLabel}</div>
        </div>
      `;
      const pickupIcon = L.divIcon({
        html: pickupHtml,
        className: 'custom-pickup-div-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(markersLayerRef.current);
    }

    // 4. Marcador de Destino (Pin Amber o Verde para Pasajero)
    if (dropoff) {
      const isPassengerPin = dropoffLabel.toLowerCase().includes('pasajero');
      const dropoffHtml = `
        <div class="leaflet-dropoff-marker ${isPassengerPin ? 'passenger-target' : ''}">
          <div class="dropoff-pin" style="${isPassengerPin ? 'background: linear-gradient(135deg, #10b981, #059669); border-color: #34d399;' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="dropoff-label" style="${isPassengerPin ? 'background: #064e3b; border-color: #10b981; color: #a7f3d0;' : ''}">${dropoffLabel}</div>
        </div>
      `;
      const dropoffIcon = L.divIcon({
        html: dropoffHtml,
        className: 'custom-dropoff-div-icon',
        iconSize: [40, 48],
        iconAnchor: [20, 44]
      });

      L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon })
        .addTo(markersLayerRef.current);
    }

    // 5. Línea de Ruta Neón (Polyline)
    if (pickup && dropoff) {
      const points = routePolyline.length > 0 
        ? routePolyline 
        : [
            [pickup.lat, pickup.lng],
            // Punto intermedio estilizado en Bariloche
            [(pickup.lat + dropoff.lat) / 2 + 0.002, (pickup.lng + dropoff.lng) / 2 - 0.001],
            [dropoff.lat, dropoff.lng]
          ];

      // Sombra oscura y halo exterior de la ruta
      L.polyline(points, {
        color: '#00293d',
        weight: 9,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayerRef.current);

      // Trazo Neón Cian resplandeciente calle por calle (Estilo Uber / Cabify)
      L.polyline(points, {
        color: '#00e5ff',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayerRef.current);

      // Si tenemos origen y destino, encuadrar el mapa
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickup) {
      map.panTo([pickup.lat, pickup.lng], { animate: true });
    }
  }, [pickup, dropoff, drivers, assignedDriver, assignedDriverLoc, routePolyline]);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = (e) => {
    e.stopPropagation();
    if (mapInstanceRef.current) {
      const target = pickup ? [pickup.lat, pickup.lng] : [BARILOCHE_CENTER.lat, BARILOCHE_CENTER.lng];
      mapInstanceRef.current.setView(target, 14.5, { animate: true });
    }
  };

  return (
    <div className={`barigo-map-wrapper ${className}`}>
      <div ref={mapContainerRef} className="leaflet-map-element" />

      {/* Controles Flotantes del Mapa */}
      <div className="map-float-controls">
        <button className="map-float-btn" onClick={handleZoomIn} title="Acercar">
          <Plus size={18} />
        </button>
        <button className="map-float-btn" onClick={handleZoomOut} title="Alejar">
          <Minus size={18} />
        </button>
        <button className="map-float-btn recenter" onClick={handleRecenter} title="Mi Ubicación / Centrar Bariloche">
          <Crosshair size={18} />
        </button>
      </div>

      {/* Watermark sutil BariGo */}
      <div className="map-watermark">
        <span className="wm-dot"></span>
        <span>BariGo GPS • Bariloche</span>
      </div>
    </div>
  );
}
