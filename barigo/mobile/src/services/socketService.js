import { io } from 'socket.io-client';

// URL del servidor WebSocket (VPS en producción)
export const SOCKET_URL = 'https://oscarsoft.com.ar';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId = 'usr-pasajero-1', role = 'passenger') {
    if (this.socket && this.socket.connected) return this.socket;

    try {
      this.socket = io(SOCKET_URL, {
        query: { userId, role },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1500
      });

      this.socket.on('connect', () => {
        console.log('[Socket Mobile] Conectado exitosamente a BariGo VPS:', this.socket.id);
        if (role === 'driver') {
          this.socket.emit('driver:register', { driverId: userId });
        }
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket Mobile] Desconectado del servidor');
      });
    } catch (e) {
      console.warn('[Socket Mobile] Error al conectar:', e);
    }

    return this.socket;
  }

  getSocket() {
    return this.socket || this.connect();
  }

  // Pasajero solicita viaje
  requestRide(rideData) {
    const s = this.getSocket();
    if (s) {
      s.emit('ride:request', rideData);
    }
  }

  // Pasajero cancela viaje
  cancelRide(rideId) {
    const s = this.getSocket();
    if (s) {
      s.emit('ride:cancel', { rideId });
    }
  }

  // Chofer envía ubicación GPS
  sendDriverLocation(driverId, { lat, lng, heading, speed, activeRideId }) {
    const s = this.getSocket();
    if (s) {
      s.emit('driver:update_location', {
        driverId,
        lat,
        lng,
        heading,
        speed,
        activeRideId
      });
    }
  }

  // Chofer acepta viaje
  acceptRide(rideId, driverId, driverInfo) {
    const s = this.getSocket();
    if (s) {
      s.emit('ride:accept', { rideId, driverId, driver: driverInfo });
    }
  }

  // Chofer actualiza estado ('arriving', 'in_progress', 'completed')
  updateRideStatus(rideId, status) {
    const s = this.getSocket();
    if (s) {
      s.emit('ride:update_status', { rideId, status });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
