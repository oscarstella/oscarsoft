import { io } from 'socket.io-client';

// URL del servidor (configurable a oscarsoft.com.ar en producción o IP local en desarrollo)
export const SOCKET_URL = 'https://oscarsoft.com.ar';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId, role) {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      query: { userId, role },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('[Socket Mobile] Conectado al servidor BariGo:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket Mobile] Desconectado');
    });

    return this.socket;
  }

  // Chofer envía ubicación GPS
  sendDriverLocation(driverId, { lat, lng, heading, speed, activeRideId }) {
    if (this.socket) {
      this.socket.emit('driver:update_location', {
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
  acceptRide(rideId, driverId) {
    if (this.socket) {
      this.socket.emit('ride:accept', { rideId, driverId });
    }
  }

  // Chofer actualiza estado ('arriving', 'in_progress', 'completed')
  updateRideStatus(rideId, status) {
    if (this.socket) {
      this.socket.emit('ride:update_status', { rideId, status });
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
